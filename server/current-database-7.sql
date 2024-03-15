--
-- PostgreSQL database dump
--

-- Dumped from database version 15.3
-- Dumped by pg_dump version 16.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.admins OWNER TO postgres;

--
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admins_id_seq OWNER TO postgres;

--
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;


--
-- Name: tablename; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tablename (
    person_id integer,
    full_name character varying(512),
    given_name character varying(512),
    last_name character varying(512),
    gender character varying(512),
    elite_institution character varying(512),
    graduate_degree character varying(512),
    mfa_degree character varying(512),
    role character varying(512),
    prize_institution character varying(512),
    prize_name character varying(512),
    prize_year integer,
    prize_genre character varying(512),
    prize_type character varying(512),
    prize_amount integer,
    title_of_winning_book character varying(512),
    verified boolean,
    author_id integer,
    book_id integer NOT NULL,
    award_id integer
);


ALTER TABLE public.tablename OWNER TO postgres;

--
-- Name: tablename_book_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tablename_book_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tablename_book_id_seq OWNER TO postgres;

--
-- Name: tablename_book_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tablename_book_id_seq OWNED BY public.tablename.book_id;


--
-- Name: user_book_likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_book_likes (
    like_id integer NOT NULL,
    user_id integer NOT NULL,
    book_id integer NOT NULL,
    likedon date NOT NULL,
    liked boolean
);


ALTER TABLE public.user_book_likes OWNER TO postgres;

--
-- Name: user_book_likes_like_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_book_likes_like_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_book_likes_like_id_seq OWNER TO postgres;

--
-- Name: user_book_likes_like_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_book_likes_like_id_seq OWNED BY public.user_book_likes.like_id;


--
-- Name: user_preferred_books; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_preferred_books (
    id integer NOT NULL,
    user_id integer NOT NULL,
    book_id integer NOT NULL
);


ALTER TABLE public.user_preferred_books OWNER TO postgres;

--
-- Name: user_preferred_books_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_preferred_books_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_preferred_books_id_seq OWNER TO postgres;

--
-- Name: user_preferred_books_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_preferred_books_id_seq OWNED BY public.user_preferred_books.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    hash character varying(255) NOT NULL,
    reading_preference character varying(255),
    favorite_genre character varying(255)
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: admins id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);


--
-- Name: tablename book_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tablename ALTER COLUMN book_id SET DEFAULT nextval('public.tablename_book_id_seq'::regclass);


--
-- Name: user_book_likes like_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_book_likes ALTER COLUMN like_id SET DEFAULT nextval('public.user_book_likes_like_id_seq'::regclass);


--
-- Name: user_preferred_books id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_preferred_books ALTER COLUMN id SET DEFAULT nextval('public.user_preferred_books_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admins (id, username, email, password_hash, created_at) FROM stdin;
4	Drewadoo	zabocek@gmail.com	$2b$10$lTV6fugrJAS5Maf.r/ifp.1qbyUfbzsSwwjnSYyw0EayQzTbMAHsm	2024-03-15 13:23:17.732731
\.


--
-- Data for Name: tablename; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tablename (person_id, full_name, given_name, last_name, gender, elite_institution, graduate_degree, mfa_degree, role, prize_institution, prize_name, prize_year, prize_genre, prize_type, prize_amount, title_of_winning_book, verified, author_id, book_id, award_id) FROM stdin;
328	Carolyn Kizer	Carolyn	Kizer	female	Columbia University	graduate	\N	winner	Columbia University	Pulitzer Prize	1985	poetry	book	15000	Yin	t	252	459	15
599	Donna Tartt	Donna	Tartt	female	\N	\N	\N	winner	Columbia University	Pulitzer Prize	2014	prose	book	15000	The Goldfinch	t	499	587	15
1233	Joyce Carol Oates	Joyce Carol	Oates	female	\N	graduate	\N	winner	National Book Foundation	National Book Award	1970	prose	book	10000	Them	t	365	693	14
1738	Norman Mailer	Norman	Mailer	male	Harvard University	\N	\N	winner	Columbia University	Pulitzer Prize	1980	prose	book	15000	The Executioners Song	t	299	361	15
2219	Thomas Edwards	Thomas	Edwards	male	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1984	prose	book	15000	Ironweed	f	\N	1235	\N
1	A. B. Guthrie Jr	A. B.	Guthrie Jr	male	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1950	prose	book	15000	The Way West	t	187	680	15
3	A. G. Mojtabai	A. G.	Mojtabai	female	Columbia University	graduate	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1983	prose	book	10000	Autumn	t	337	62	17
6	A. R. Ammons	A. R.	Ammons	male	\N	graduate	\N	winner	National Book Foundation	National Book Award	1993	poetry	book	10000	Garbage	t	12	222	14
6	A. R. Ammons	A. R.	Ammons	male	\N	graduate	\N	winner	National Book Foundation	National Book Award	1973	poetry	book	10000	Collected Poems 1951-1971	t	12	136	14
14	Adam Hochschild	Adam	Hochschild	male	Harvard University	\N	\N	winner	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	1998	prose	book	15000	Finding The Trapdoor: : Essays Portraits Travels	t	219	213	2
15	Adam Johnson	Adam	Johnson	male	Stanford University	graduate	McNeese State University	winner	Columbia University	Pulitzer Prize	2013	prose	book	15000	The Orphan Masters Son	t	233	639	15
15	Adam Johnson	Adam	Johnson	male	Stanford University	graduate	McNeese State University	winner	National Book Foundation	National Book Award	2015	prose	book	10000	Fortune Smiles	t	233	218	14
18	Adria Bernardi	Adria	Bernardi	female	University of Chicago	graduate	\N	winner	University of Pittsburg Press	Drue Heinz Literature Prize	2000	prose	book	15000	In The Gathering Woods	t	38	270	4
19	Adrian Blevins	Adrian	Blevins	female	\N	graduate	Warren Wilson College	winner	Claremont Graduate University	Kate Tufts Discovery Award 	2004	poetry	book	10000	The Brass Girl Brouhaha	t	44	543	10
22	Adriana Ramirez	Adriana	Ramirez	female	\N	graduate	University of Pittsburgh	winner	PEN America	Fusion Emerging Writers Prize	2015	prose	book	10000	Dead Boys	t	410	115	7
25	Adrienne Rich	Adrienne	Rich	female	Radcliffe College	graduate	\N	winner	Academy of American Poets	Lenore Marshall Poetry Prize	1992	poetry	book	25000	An Atlas Of The Difficult World	t	418	46	13
25	Adrienne Rich	Adrienne	Rich	female	Radcliffe College	graduate	\N	winner	National Book Foundation	National Book Award	1974	poetry	book	10000	Diving Into The Wreck: Poems 1971-1972	t	418	177	14
26	Afaa Michael Weaver	Afaa Michael	Weaver	male	Brown University	graduate	\N	winner	Claremont Graduate University	Kingsley Tufts Poetry Award	2014	poetry	book	100000	The Government Of Nature	t	538	591	11
30	Ai Ogawa	Ai	Ogawa	female	\N	graduate	Univeristy of California Irvine	winner	National Book Foundation	National Book Award	1999	poetry	book	10000	Vice: New And Selected Poems	t	370	725	14
32	Akhil Sharma	Akhil	Sharma	male	Princeton University Stanford University Harvard University	graduate	\N	winner	PEN America	Hemingway Award for Debut Novel	2001	prose	book	10000	An Obedient Father	t	451	48	8
37	Alan Dugan	Alan	Dugan	male	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1962	poetry	book	15000	Poems	t	126	424	15
37	Alan Dugan	Alan	Dugan	male	\N	\N	\N	winner	National Book Foundation	National Book Award	1962	poetry	book	10000	Poems (Vol 1 of Seven)	t	126	448	14
37	Alan Dugan	Alan	Dugan	male	\N	\N	\N	winner	National Book Foundation	National Book Award	2001	poetry	book	10000	Poems Seven: New And Complete Poetry (Vol 7 Of Seven)	t	126	450	14
40	Alan Hewat	Alan	Hewat	male	\N	\N	\N	winner	PEN America	Hemingway Award for Debut Novel	1986	prose	book	10000	Ladys Time	t	213	296	8
44	Alan Saperstein	Alan	Saperstein	male	\N	\N	\N	winner	PEN America	Hemingway Award for Debut Novel	1980	prose	book	10000	Mom Kills Kids And Self	t	438	128	8
45	Alan Shapiro	Alan	Shapiro	male	Stanford University	graduate	\N	winner	Claremont Graduate University	Kingsley Tufts Poetry Award	2001	poetry	book	100000	The Dead Alive And Busy	t	449	355	11
58	Alex Haley	Alex	Haley	male	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1977	prose	book	15000	Roots	t	192	467	15
76	Alice McDermott	Alice	McDermott	female	\N	graduate	\N	winner	National Book Foundation	National Book Award	1998	prose	book	10000	Charming Billy	t	316	100	14
79	Alice Notley	Alice	Notley	female	Barnard College	graduate	University of Iowa	winner	Academy of American Poets	Lenore Marshall Poetry Prize	2007	poetry	book	25000	Grave Of Light: New And Selected Poems 1970-2005	t	361	234	13
82	Alice Walker	Alice	Walker	female	\N	\N	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1974	prose	book	10000	In Love & Trouble	t	531	263	17
82	Alice Walker	Alice	Walker	female	\N	\N	\N	winner	National Book Foundation	National Book Award	1983	prose	book	10000	The Color Purple	t	531	559	14
85	Alison Lurie	Alison	Lurie	female	Radcliffe College	\N	\N	winner	Columbia University	Pulitzer Prize	1985	prose	book	15000	Foreign Affairs	t	291	216	15
92	Allen Drury	Allen	Drury	male	Stanford University	\N	\N	winner	Columbia University	Pulitzer Prize	1960	prose	book	15000	Advise And Consent	t	125	31	15
93	Allen Ginsberg	Allen	Ginsberg	male	Columbia University	\N	\N	winner	National Book Foundation	National Book Award	1974	poetry	book	10000	The Fall Of America: Poems Of These States 1965-1971	t	169	382	14
95	Allen Tate	Allen	Tate	male	\N	\N	\N	winner	Academy of American Poets	Lenore Marshall Poetry Prize	1978	poetry	book	25000	Collected Poems 1919-1976	t	500	133	13
110	Amy Lowell	Amy	Lowell	female	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1926	poetry	book	15000	Whats OClock	t	288	446	15
113	Amy Wilentz	Amy	Wilentz	female	Harvard University	\N	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	2002	prose	book	10000	Martyrs Crossing	t	548	332	17
122	Andrea Barrett	Andrea	Barrett	female	\N	\N	\N	winner	National Book Foundation	National Book Award	1996	prose	book	10000	Ship Fever And Other Stories	t	28	338	14
129	Andrew Sean Greer	Andrew Sean	Greer	male	Brown University	graduate	University of Montana	winner	Columbia University	Pulitzer Prize	2018	prose	book	15000	Less	t	180	305	15
135	Angela Morales	Angela	Morales	female	\N	graduate	University of Iowa	winner	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	2017	prose	book	15000	The Girls In My Town: Essays	t	340	586	2
137	Angie Estes	Angie	Estes	female	\N	graduate	\N	winner	Claremont Graduate University	Kingsley Tufts Poetry Award	2015	poetry	book	100000	EnchantÃ¨e	t	139	195	11
140	Ann Arsensberg	Ann	Arsensberg	female	Radcliffe College Harvard University	graduate	\N	winner	National Book Foundation	National Book Award	1981	prose	book	10000	Sister Wolf	t	17	340	14
149	Ann Patchett	Ann	Patchett	female	\N	graduate	University of Iowa	winner	PEN America	Faulkner Award for Fiction	2002	prose	book	15000	Bel Canto	t	384	68	5
159	Anne Sanow	Anne	Sanow	female	\N	graduate	Washington University	winner	University of Pittsburg Press	Drue Heinz Literature Prize	2009	prose	book	15000	Triple Time	t	436	426	4
160	Anne Sexton	Anne	Sexton	female	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1967	poetry	book	15000	Live Or Die	t	446	313	15
162	Anne Tyler	Anne	Tyler	female	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1989	prose	book	15000	Breathing Lessons	t	516	88	15
165	Anne Winters	Anne	Winters	female	Columbia University	graduate	\N	winner	Academy of American Poets	Lenore Marshall Poetry Prize	2005	poetry	book	25000	The Displaced Of Capital	t	558	358	13
167	Annie Dillard	Annie	Dillard	female	\N	graduate	\N	winner	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	2000	prose	book	15000	For The Time Being	t	117	215	2
170	Annie Proulx	Annie	Proulx	female	\N	graduate	\N	winner	PEN America	Faulkner Award for Fiction	1993	prose	book	15000	Postcards	t	407	453	5
170	Annie Proulx	Annie	Proulx	female	\N	graduate	\N	winner	Columbia University	Pulitzer Prize	1994	prose	book	15000	The Shipping News	t	407	652	15
172	Anthony Doerr	Anthony	Doerr	male	\N	graduate	Bowling Green State University	winner	Columbia University	Pulitzer Prize	2015	prose	book	15000	All The Light We Cannot See	t	120	37	15
173	Anthony Hecht	Anthony	Hecht	male	Columbia University	graduate	\N	winner	Columbia University	Pulitzer Prize	1968	poetry	book	15000	The Hard Hours	t	206	598	15
174	Anthony Marra	Anthony	Marra	male	Stanford University	graduate	University of Iowa	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	2016	prose	book	10000	The Tsar Of Love And Techno	t	303	675	17
175	Anthony Varallo	Anthony	Varallo	male	\N	graduate	University of Iowa	winner	University of Pittsburg Press	Drue Heinz Literature Prize	2008	prose	book	15000	Out Loud	t	523	142	4
176	Anthony Wallace	Anthony	Wallace	male	\N	graduate	\N	winner	University of Pittsburg Press	Drue Heinz Literature Prize	2013	prose	book	15000	The Old Priest	t	533	415	4
183	Archibald Macleish	Archibald	Macleish	male	Yale University	graduate	\N	winner	Columbia University	Pulitzer Prize	1933	poetry	book	15000	Conquistador	t	297	146	15
183	Archibald Macleish	Archibald	Macleish	male	Yale University	graduate	\N	winner	Columbia University	Pulitzer Prize	1953	poetry	book	15000	Collected Poems 1917-1952	t	297	103	15
188	Arna Bontemps Hemenway	Arna Bontemps	Hemenway	male	\N	graduate	University of Iowa	winner	PEN America	Hemingway Award for Debut Novel	2015	prose	book	10000	Elegy On Kinderklavier	t	209	193	8
196	Arthur Sze	Arthur	Sze	male	\N	\N	\N	winner	National Book Foundation	National Book Award	2019	poetry	book	10000	Sight Lines	t	495	339	14
198	Atsuro Riley	Atsuro	Riley	male	\N	\N	\N	winner	Claremont Graduate University	Kate Tufts Discovery Award 	2011	poetry	book	10000	Romeys Order	t	421	165	10
199	Atticus Lish	Atticus	Lish	male	Harvard University	\N	\N	winner	PEN America	Faulkner Award for Fiction	2015	prose	book	15000	Preparation For The Next Life	t	281	455	5
200	Audrey Wurdemann	Audrey	Wurdemann	female	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1935	poetry	book	15000	Bright Ambush	t	570	90	15
207	Azareen Van Der Vliet Oloomi	Azareen	Van Der Vliet Oloomi	female	Brown University	graduate	Brown University	winner	PEN America	Faulkner Award for Fiction	2019	prose	book	15000	Call Me Zebra	t	519	97	5
208	B. H. Fairchild	B. H.	Fairchild	male	\N	graduate	\N	winner	Claremont Graduate University	Kingsley Tufts Poetry Award	1999	poetry	book	100000	The Art Of The Lathe	t	143	527	11
213	Barbara Croft	Barbara	Croft	female	\N	graduate	\N	winner	University of Pittsburg Press	Drue Heinz Literature Prize	1998	prose	book	15000	Necessary Fictions	t	99	371	4
216	Barbara Hamby	Barbara	Hamby	female	\N	graduate	\N	winner	Claremont Graduate University	Kate Tufts Discovery Award 	1996	poetry	book	10000	Delirium	t	195	168	10
219	Barbara Ras	Barbara	Ras	female	\N	graduate	University of Oregon	winner	Claremont Graduate University	Kate Tufts Discovery Award 	1999	poetry	book	10000	Bite Every Sorrow	t	412	76	10
223	Ben Fountain	Ben	Fountain	male	\N	graduate	\N	winner	PEN America	Hemingway Award for Debut Novel	2007	prose	book	10000	Brief Encounters With Che Guevara	t	156	89	8
223	Ben Fountain	Ben	Fountain	male	\N	graduate	\N	winner	Center for Fiction	First Novel Prize	2012	prose	book	15000	Billy Lynns Long Halftime Walk	t	156	75	6
230	Benjamine Alire Saenz	Benjamine Alire	Saenz	male	\N	graduate	University of Texas El Paso	winner	PEN America	Faulkner Award for Fiction	2013	prose	book	15000	Everything Begins & Ends At The Kentucky Club	t	433	200	5
233	Bernard Cooper	Bernard	Cooper	male	\N	graduate	California Institute of the Arts	winner	PEN America	Hemingway Award for Debut Novel	1991	prose	book	10000	Maps To Anywhere	t	93	328	8
234	Bernard Knox	Bernard	Knox	male	Harvard University Yale University	graduate	\N	winner	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	1990	prose	book	15000	Essays Ancient And Modern	t	256	196	2
235	Bernard Malamud	Bernard	Malamud	male	Columbia University	graduate	\N	winner	National Book Foundation	National Book Award	1959	prose	book	10000	The Magic Barrel	t	300	620	14
235	Bernard Malamud	Bernard	Malamud	male	Columbia University	graduate	\N	winner	National Book Foundation	National Book Award	1967	prose	book	10000	The Fixer	t	300	581	14
235	Bernard Malamud	Bernard	Malamud	male	Columbia University	graduate	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1958	prose	book	10000	The Assistant	t	300	528	17
240	Beth Bachmann	Beth	Bachmann	female	\N	graduate	\N	winner	Claremont Graduate University	Kate Tufts Discovery Award 	2010	poetry	book	10000	Temper	t	23	518	10
241	Beth Bosworth	Beth	Bosworth	female	\N	graduate	\N	winner	University of Pittsburg Press	Drue Heinz Literature Prize	2012	prose	book	15000	The Source Of Life And Other Stories	t	49	657	4
260	Bob Shacochis	Bob	Shacochis	male	\N	\N	\N	winner	National Book Foundation	National Book Award	1985	prose	book	10000	Easy In The Islands	t	448	188	14
261	Bobbie Ann Mason	Bobbie Ann	Mason	female	\N	graduate	\N	winner	PEN America	Hemingway Award for Debut Novel	1983	prose	book	10000	Shiloh And Other Stories	t	307	486	8
263	Bonnie Nadzam	Bonnie	Nadzam	female	\N	graduate	\N	winner	Center for Fiction	First Novel Prize	2011	prose	book	15000	Lamb	t	351	297	6
264	Booth Tarkington	Booth	Tarkington	male	Princeton University	\N	\N	winner	Columbia University	Pulitzer Prize	1922	prose	book	15000	Alice Adams	t	498	33	15
264	Booth Tarkington	Booth	Tarkington	male	Princeton University	\N	\N	winner	Columbia University	Pulitzer Prize	1919	prose	book	15000	The Magnificent Ambersons	t	498	622	15
265	Brad Felver	Brad	Felver	male	Harvard University	graduate	Bowling Green State University	winner	University of Pittsburg Press	Drue Heinz Literature Prize	2018	prose	book	15000	The Dogs Of Detroit	t	145	573	4
270	Brando Skyhorse	Brando	Skyhorse	male	Stanford University	graduate	Univeristy of California Irvine	winner	PEN America	Hemingway Award for Debut Novel	2011	prose	book	10000	The Madonnas Of Echo Park	t	460	617	8
271	Brandon Som	Brandon	Som	male	\N	graduate	University of Pittsburgh	winner	Claremont Graduate University	Kate Tufts Discovery Award 	2015	poetry	book	10000	The Tribute Horse	t	470	673	10
278	Brett Ellen Block	Brett Ellen	Block	female	\N	graduate	University of Iowa	winner	University of Pittsburg Press	Drue Heinz Literature Prize	2001	prose	book	15000	Destination Known	t	45	170	4
300	C. D. Wright	C. D.	Wright	female	\N	graduate	University of Arkansas	winner	Academy of American Poets	Lenore Marshall Poetry Prize	2011	poetry	book	25000	One With Others	t	564	141	13
301	C. E. Morgan	C. E.	Morgan	female	Harvard University	graduate	\N	winner	Kirkus Review	Kirkus Prize	2016	prose	book	50000	The Sport Of Kings	t	341	660	12
302	C. K. Williams	C. K.	Williams	male	University of Pennsylvania	\N	\N	winner	Columbia University	Pulitzer Prize	2000	poetry	book	15000	The World 	t	550	691	15
302	C. K. Williams	C. K.	Williams	male	University of Pennsylvania	\N	\N	winner	National Book Foundation	National Book Award	2003	poetry	book	10000	The Singing	t	550	655	14
308	Campbell McGrath	Campbell	McGrath	male	University of Chicago Columbia University	graduate	Columbia University	winner	Claremont Graduate University	Kingsley Tufts Poetry Award	1997	poetry	book	100000	Spring Comes To Chicago	t	318	505	11
309	Carl Dennis	Carl	Dennis	male	\N	graduate	\N	winner	Columbia University	Pulitzer Prize	2002	poetry	book	15000	Practical Gods	t	111	548	15
310	Carl Phillips	Carl	Phillips	male	Harvard University	graduate	\N	winner	Claremont Graduate University	Kingsley Tufts Poetry Award	2002	poetry	book	100000	The Tether	t	392	669	11
311	Carl Sandburg	Carl	Sandburg	male	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1951	poetry	book	15000	Complete Poems	t	435	108	15
311	Carl Sandburg	Carl	Sandburg	male	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1919	poetry	book	15000	Corn Huskers	t	435	148	15
320	Carol Shields	Carol	Shields	female	\N	graduate	\N	winner	Columbia University	Pulitzer Prize	1995	prose	book	15000	The Stone Diaries	t	452	661	15
324	Caroline Kim	Caroline	Kim	female	\N	graduate	University of Michigan	winner	University of Pittsburg Press	Drue Heinz Literature Prize	2020	prose	book	15000	The Prince Of Mournful Thoughts And Other Stories	t	249	644	4
325	Caroline Miller	Caroline	Miller	female	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1934	prose	book	15000	Lamb In His Bosom	t	333	300	15
326	Carolyn Cooke	Carolyn	Cooke	female	Columbia University	graduate	Columbia University	winner	PEN America	Robert W. Bingham Prize for Debut Short Story Collection	2002	prose	book	25000	The Bostons	t	92	542	16
332	Cate Marvin	Cate	Marvin	female	\N	graduate	University of Iowa	winner	Claremont Graduate University	Kate Tufts Discovery Award 	2002	poetry	book	10000	Worlds Tallest Disaster	t	306	457	10
335	Catherine Bowman	Catherine	Bowman	female	Columbia University	graduate	Columbia University	winner	Claremont Graduate University	Kate Tufts Discovery Award 	1994	poetry	book	10000	1-800-Hot-Ribs	t	51	510	10
342	Chang-Rae Lee	Chang-Rae	Lee	male	Yale University	graduate	University of Oregon	winner	PEN America	Hemingway Award for Debut Novel	1996	prose	book	10000	Native Speaker	t	269	367	8
350	Charles Frazier	Charles	Frazier	male	\N	graduate	\N	winner	National Book Foundation	National Book Award	1997	prose	book	10000	Cold Mountain	t	160	854	14
352	Charles Harper Webb	Charles Harper	Webb	male	\N	graduate	University of Washington	winner	Claremont Graduate University	Kate Tufts Discovery Award 	1998	poetry	book	10000	Reading The Water	t	539	161	10
354	Charles Johnson	Charles	Johnson	male	\N	graduate	\N	winner	National Book Foundation	National Book Award	1990	prose	book	10000	Middle Passage	t	234	123	14
362	Charles Simic	Charles	Simic	male	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1990	poetry	book	15000	The World Doesnt End	t	455	688	15
364	Charles Wright	Charles	Wright	male	\N	graduate	University of Iowa	winner	Columbia University	Pulitzer Prize	1998	poetry	book	15000	Black Zodiac	t	565	79	15
364	Charles Wright	Charles	Wright	male	\N	graduate	University of Iowa	winner	Academy of American Poets	Lenore Marshall Poetry Prize	1996	poetry	book	25000	Chickamauga	t	565	105	13
364	Charles Wright	Charles	Wright	male	\N	graduate	University of Iowa	winner	National Book Foundation	National Book Award	1983	poetry	book	10000	Country Music: Selected Early Poems	t	565	152	14
365	Charles Yu	Charles	Yu	male	\N	\N	\N	winner	National Book Foundation	National Book Award	2020	prose	book	10000	Interior China Town	t	576	283	14
368	Chase Twichell	Chase	Twichell	female	\N	graduate	University of Iowa	winner	Claremont Graduate University	Kingsley Tufts Poetry Award	2011	poetry	book	100000	Horses Where Answers Should Have Been	t	515	251	11
375	Chloe Aridjis	Chloe	Aridjis	female	Harvard University	graduate	\N	winner	PEN America	Faulkner Award for Fiction	2020	prose	book	15000	Sea Monsters	t	14	205	5
377	Chris Abani	Chris	Abani	male	\N	graduate	\N	winner	PEN America	Hemingway Award for Debut Novel	2005	prose	book	10000	Graceland	t	1	233	8
378	Chris Adrian	Chris	Adrian	male	Harvard University	graduate	University of Iowa	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	2009	prose	book	10000	A Better Angel	t	6	1520	17
385	Christian Hawkey	Christian	Hawkey	male	\N	graduate	University of Massachusetts Amherst	winner	Claremont Graduate University	Kate Tufts Discovery Award 	2006	poetry	book	10000	The Book Of Funnels	t	203	539	10
391	Christopher Brookhouse	Christopher	Brookhouse	male	Stanford University Harvard University	graduate	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1971	prose	book	10000	Running Out	t	58	469	17
392	Christopher Coake	Christopher	Coake	male	\N	graduate	Ohio State University	winner	PEN America	Robert W. Bingham Prize for Debut Short Story Collection	2006	prose	book	25000	WeRe In Trouble	t	85	444	16
396	Christopher Hitchens	Christopher	Hitchens	male	\N	\N	\N	winner	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	2012	prose	book	15000	Arguably: Selected Essays	t	217	53	2
404	Cid Corman	Cid	Corman	male	\N	\N	\N	winner	Academy of American Poets	Lenore Marshall Poetry Prize	1975	poetry	book	25000	O/I	t	94	403	13
406	Claire Vaye Watkins	Claire Vaye	Watkins	female	\N	graduate	Ohio State University	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	2013	prose	book	10000	Battleborn	t	537	64	17
414	Claudia Emerson	Claudia	Emerson	female	\N	graduate	University of North Carolina	winner	Columbia University	Pulitzer Prize	2006	poetry	book	15000	Late Wife	t	136	303	15
425	Colson Whitehead	Colson	Whitehead	male	Harvard University	\N	\N	winner	Columbia University	Pulitzer Prize	2020	prose	book	15000	The Nickel Boys	t	543	413	15
425	Colson Whitehead	Colson	Whitehead	male	Harvard University	\N	\N	winner	National Book Foundation	National Book Award	2016	prose	book	10000	The Underground Railroad	t	543	676	14
426	Colum McCann	Colum	McCann	male	\N	\N	\N	winner	National Book Foundation	National Book Award	2009	prose	book	10000	Let The Great World Spin	t	314	306	14
428	Conrad Aiken	Conrad	Aiken	male	Harvard University	\N	\N	winner	Columbia University	Pulitzer Prize	1930	poetry	book	15000	Selected Poems	t	8	473	15
428	Conrad Aiken	Conrad	Aiken	male	Harvard University	\N	\N	winner	National Book Foundation	National Book Award	1954	poetry	book	10000	Collected Poems	t	8	855	14
429	Conrad Richter	Conrad	Richter	male	\N	\N	\N	winner	National Book Foundation	National Book Award	1961	prose	book	10000	The Waters Of Kronos	t	420	687	14
429	Conrad Richter	Conrad	Richter	male	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1951	prose	book	15000	The Town	t	420	547	15
430	Cormac McCarthy	Cormac	McCarthy	male	\N	\N	\N	winner	Columbia University	Pulitzer Prize	2007	prose	book	15000	The Road	t	315	650	15
430	Cormac McCarthy	Cormac	McCarthy	male	\N	\N	\N	winner	National Book Foundation	National Book Award	1992	prose	book	10000	All The Pretty Horses	t	315	38	14
435	Craig Morgan Teicher	Craig Morgan	Teicher	male	Columbia University	graduate	\N	winner	Academy of American Poets	Lenore Marshall Poetry Prize	2018	poetry	book	25000	The Trembling Answers	t	507	672	13
445	Cynthia Ozick	Cynthia	Ozick	female	\N	graduate	\N	winner	PEN America	Diamonstein-Spielvogel Award For The Art Of The Essay	1997	prose	book	15000	Fame And Folly: Essays	t	381	210	3
448	D. A. Powell	D. A.	Powell	male	\N	graduate	University of Iowa	winner	Claremont Graduate University	Kingsley Tufts Poetry Award	2010	poetry	book	100000	Chronic	t	402	852	11
452	Dagoberto Gilb	Dagoberto	Gilb	male	\N	graduate	\N	winner	PEN America	Hemingway Award for Debut Novel	1994	prose	book	10000	The Magic Of Blood	t	167	618	8
454	Dalia Sofer	Dalia	Sofer	female	\N	graduate	Sarah Lawrence College	winner	PEN America	Robert W. Bingham Prize for Debut Short Story Collection	2008	prose	book	25000	The Septembers Of Shiraz	t	469	1316	16
462	Dana Spiotta	Dana	Spiotta	female	\N	\N	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	2007	prose	book	10000	Eat The Document	t	476	189	17
464	Danez Smith	Danez	Smith	male	\N	graduate	University of Michigan	winner	Claremont Graduate University	Kate Tufts Discovery Award 	2016	poetry	book	10000	[Insert] Boy	t	464	736	10
467	Daniel Borzutzky	Daniel	Borzutzky	male	\N	graduate	School of Art Institute of Chicago	winner	National Book Foundation	National Book Award	2016	poetry	book	10000	The Performance Of Becoming Human	t	48	642	14
477	Daniel Stern	Daniel	Stern	male	\N	\N	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1990	prose	book	10000	Twice Told Tales	t	484	429	17
479	Danielle Evans	Danielle	Evans	female	Columbia University	graduate	University of Iowa	winner	PEN America	Robert W. Bingham Prize for Debut Short Story Collection	2011	prose	book	25000	Before You Suffocate Your Own Fool Self	t	141	66	16
485	Daniyal Mueenuddin	Daniyal	Mueenuddin	male	Dartmouth College	graduate	University of Arizona	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	2010	prose	book	10000	In Other Rooms Other Wonders	t	347	264	17
487	Danny Santiago	Danny	Santiago	male	Yale University	\N	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1984	prose	book	10000	Famous All Over Town	t	437	211	17
489	Darcy OBrien	Darcy	OBrien	male	Princeton University	graduate	\N	winner	PEN America	Hemingway Award for Debut Novel	1978	prose	book	10000	A Way Of Life Like Any Other	t	366	29	8
491	Darrell Spencer	Darrell	Spencer	male	\N	graduate	\N	winner	University of Pittsburg Press	Drue Heinz Literature Prize	2004	prose	book	15000	Bring Your Legs With You	t	473	92	4
502	David Bosworth	David	Bosworth	male	Brown University	\N	\N	winner	University of Pittsburg Press	Drue Heinz Literature Prize	1981	prose	book	15000	The Death Of Descartes	t	50	356	4
504	David Bradley	David	Bradley	male	University of Pennsylvania	graduate	\N	winner	PEN America	Faulkner Award for Fiction	1982	prose	book	15000	Seaview	t	53	206	5
505	David Bromwich	David	Bromwich	male	Yale University	graduate	\N	winner	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	2002	prose	book	15000	Skeptical Music: Essays on Modern Poetry	t	56	341	2
510	David Ebershoff	David	Ebershoff	male	Brown University University of Chicago	graduate	University of Chicago	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	2001	prose	book	10000	The Danish Girl	t	131	354	17
511	David Ferry	David	Ferry	male	Harvard University	graduate	\N	winner	National Book Foundation	National Book Award	2012	poetry	book	10000	Bewilderment: New Poems And Translations	t	148	73	14
511	David Ferry	David	Ferry	male	Harvard University	graduate	\N	winner	Academy of American Poets	Lenore Marshall Poetry Prize	2000	poetry	book	25000	Of No Country I Know: New And Selected Poems And Translations	t	148	408	13
515	David Guterson	David	Guterson	male	\N	graduate	University of Washington	winner	PEN America	Faulkner Award for Fiction	1995	prose	book	15000	Snow Falling On Cedars	t	186	342	5
516	David Harris Ebenbach	David Harris	Ebenbach	male	\N	graduate	Vermont College of Fine Arts 	winner	University of Pittsburg Press	Drue Heinz Literature Prize	2005	prose	book	15000	Between Camelots	t	129	71	4
528	David Long	David	Long	male	\N	graduate	University of Montana	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1996	prose	book	10000	Blue Spruce	t	286	85	17
537	David Morris	David	Morris	male	\N	graduate	\N	winner	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	1992	prose	book	15000	The Culture Of Pain	t	342	568	2
540	David Quammen	David	Quammen	male	Yale University	graduate	\N	winner	PEN America	Diamonstein-Spielvogel Award For The Art Of The Essay	2001	prose	book	15000	The Boilerplate Rhino: Nature in the Eye of the Beholder	t	409	536	3
547	David Wojahn	David	Wojahn	male	\N	graduate	University of Arizona	winner	Academy of American Poets	Lenore Marshall Poetry Prize	2012	poetry	book	25000	World Tree	t	560	447	13
553	Dawn Lundy Martin	Dawn Lundy	Martin	female	\N	graduate	\N	winner	Claremont Graduate University	Kingsley Tufts Poetry Award	2019	poetry	book	100000	Good Stock Strange Blood	t	305	231	11
555	Deshawn Charles Winslow	Deshawn Charles	Winslow	male	\N	graduate	University of Iowa	winner	Center for Fiction	First Novel Prize	2019	prose	book	15000	In West Mills	t	557	275	6
558	Deborah Digges	Deborah	Digges	female	\N	graduate	University of Iowa	winner	Claremont Graduate University	Kingsley Tufts Poetry Award	1996	poetry	book	100000	Rough Music	t	116	468	11
559	Deborah Eisenberg	Deborah	Eisenberg	female	\N	\N	\N	winner	PEN America	Faulkner Award for Fiction	2011	prose	book	15000	The Collected Stories Of Deborah Eisenberg	t	133	351	5
560	Deborah Fleming	Deborah	Fleming	female	\N	graduate	\N	winner	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	2020	prose	book	15000	Resurrection Of The Wild: Meditations On Ohios Natural Landscape	t	152	164	2
569	Denis Johnson	Denis	Johnson	male	\N	graduate	University of Iowa	winner	National Book Foundation	National Book Award	2007	prose	book	10000	Tree Of Smoke	t	235	425	14
570	Denise Levertov	Denise	Levertov	female	\N	\N	\N	winner	Academy of American Poets	Lenore Marshall Poetry Prize	1976	poetry	book	25000	The Freeing Of The Dust	t	274	409	13
575	Diana Khoi Nguyen	Diana Khoi	Nguyen	female	Columbia University	graduate	Columbia University	winner	Claremont Graduate University	Kate Tufts Discovery Award 	2019	prose	book	10000	Ghost Of	t	358	223	10
577	Diane Johnson	Diane	Johnson	female	\N	\N	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1979	prose	book	10000	Lying Low	t	236	326	17
585	Don DeLillo	Don	DeLillo	male	\N	\N	\N	winner	PEN America	Faulkner Award for Fiction	1992	prose	book	15000	Mao Ii	t	109	327	5
585	Don DeLillo	Don	DeLillo	male	\N	\N	\N	winner	National Book Foundation	National Book Award	1985	prose	book	10000	White Noise	t	109	737	14
586	Don Mee Choi	Don Mee	Choi	female	\N	graduate	\N	winner	National Book Foundation	National Book Award	2020	poetry	book	10000	DMZ Colony	t	79	176	14
591	Donald Hall	Donald	Hall	male	Harvard University Stanford University	graduate	\N	winner	Academy of American Poets	Lenore Marshall Poetry Prize	1987	poetry	book	25000	The Happy Man	t	193	597	13
457	Dan Chiasson	Dan	Chiasson	male	\N	graduate	\N	judge	Columbia University	Pulitzer Prize	2019	poetry	book	15000	Be With	f	\N	1831	\N
592	Donald Justice	Donald	Justice	male	Stanford University	graduate	\N	winner	Columbia University	Pulitzer Prize	1980	poetry	book	15000	Selected Poems	t	242	268	15
595	Donald Ray Pollock	Donald Ray	Pollock	male	\N	\N	\N	winner	PEN America	Robert W. Bingham Prize for Debut Short Story Collection	2009	prose	book	25000	Knockemstiff	t	399	295	16
596	Donald Revell	Donald	Revell	male	\N	graduate	\N	winner	Academy of American Poets	Lenore Marshall Poetry Prize	2004	poetry	book	25000	My Mojave	t	417	364	13
597	Donika Kelly	Donika	Kelly	female	\N	graduate	University of Texas Austin	winner	Claremont Graduate University	Kate Tufts Discovery Award 	2018	poetry	book	10000	Bestiary	t	247	70	10
598	Donna Gershten	Donna	Gershten	female	\N	graduate	Warren Wilson College	winner	PEN America	Bellwether Prize for Socially Engaged Fiction	2000	prose	book	25000	Kissing The Virgins Mouth	t	166	294	1
609	Doug Anderson	Doug	Anderson	male	\N	\N	\N	winner	Claremont Graduate University	Kate Tufts Discovery Award 	1995	poetry	book	10000	The Moon Reflected Fire	t	13	626	10
612	Douglas Day	Douglas	Day	male	\N	graduate	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1978	prose	book	10000	Journey Of The Wolf	t	106	293	17
613	Douglas Hobbie	Douglas	Hobbie	male	\N	\N	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1992	prose	book	10000	Boomfell	t	218	87	17
617	E. L. Doctorow	E. L.	Doctorow	male	\N	\N	\N	winner	PEN America	Faulkner Award for Fiction	1990	prose	book	15000	Billy Bathgate	t	119	74	5
617	E. L. Doctorow	E. L.	Doctorow	male	\N	\N	\N	winner	National Book Foundation	National Book Award	1986	prose	book	10000	Worlds Fair	t	119	744	14
617	E. L. Doctorow	E. L.	Doctorow	male	\N	\N	\N	winner	PEN America	Faulkner Award for Fiction	2006	prose	book	15000	The March	t	119	627	5
618	Eamon Grennan	Eamon	Grennan	male	Harvard University	graduate	\N	winner	Academy of American Poets	Lenore Marshall Poetry Prize	2003	poetry	book	25000	Still Life With Waterfall	t	183	509	13
626	Edith Pearlman	Edith	Pearlman	female	Radcliffe College	\N	\N	winner	University of Pittsburg Press	Drue Heinz Literature Prize	1996	prose	book	15000	Vaquita And Other Stories	t	385	436	4
627	Edith Wharton	Edith	Wharton	female	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1921	prose	book	15000	The Age Of Innocence	t	542	523	15
632	Edna Ferber	Edna	Ferber	female	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1925	prose	book	15000	So Big	t	146	491	15
633	Edna St Vincent Millay	Edna St Vincent	Millay	female	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1923	poetry	book	15000	The Ballad Of The Harp-Weaver: A Few Figs From Thistles: Eight Sonnets In American Poetry 1922. A Miscellany	t	332	531	15
639	Edward P. Jones	Edward P.	Jones	male	\N	graduate	University of Virginia	winner	PEN America	Hemingway Award for Debut Novel	1993	prose	book	10000	Lost In The City	t	238	318	8
639	Edward P. Jones	Edward P.	Jones	male	\N	graduate	University of Virginia	winner	Columbia University	Pulitzer Prize	2004	prose	book	15000	The Known World	t	238	611	15
643	Edwin Arlington Robinson	Edwin Arlington	Robinson	male	Harvard University	\N	\N	winner	Columbia University	Pulitzer Prize	1928	poetry	book	15000	Tristram	t	422	723	15
643	Edwin Arlington Robinson	Edwin Arlington	Robinson	male	Harvard University	\N	\N	winner	Columbia University	Pulitzer Prize	1925	poetry	book	15000	The Man Who Died Twice	t	422	621	15
643	Edwin Arlington Robinson	Edwin Arlington	Robinson	male	Harvard University	\N	\N	winner	Columbia University	Pulitzer Prize	1922	poetry	book	15000	Collected Poems	t	422	749	15
647	Edwin OConnor	Edwin	OConnor	male	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1962	prose	book	15000	The Edge Of Sadness	t	368	225	15
656	Eleanor Lerman	Eleanor	Lerman	female	\N	\N	\N	winner	Academy of American Poets	Lenore Marshall Poetry Prize	2006	poetry	book	25000	Our Post-Soviet History Unfolds	t	273	423	13
668	Elizabeth Bishop	Elizabeth	Bishop	female	\N	\N	\N	winner	National Book Foundation	National Book Award	1970	poetry	book	10000	The Complete Poems	t	42	563	14
668	Elizabeth Bishop	Elizabeth	Bishop	female	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1956	poetry	book	15000	Poems: North & South: A Cold Spring	t	42	452	15
671	Elizabeth Graver	Elizabeth	Graver	female	\N	graduate	Washington University	winner	University of Pittsburg Press	Drue Heinz Literature Prize	1991	prose	book	15000	Have You Seen Me?	t	178	241	4
678	Elizabeth Spencer	Elizabeth	Spencer	female	\N	graduate	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1957	prose	book	10000	The Voice At The Back Door	t	474	679	17
680	Elizabeth Strout	Elizabeth	Strout	female	\N	graduate	\N	winner	Columbia University	Pulitzer Prize	2009	prose	book	15000	Olive Kitteridge	t	492	140	15
687	Ellen Gilchrist	Ellen	Gilchrist	female	\N	\N	\N	winner	National Book Foundation	National Book Award	1984	prose	book	10000	Victory Over Japan: A Book Of Stories[	t	168	726	14
688	Ellen Glasgow	Ellen	Glasgow	female	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1942	prose	book	15000	In This Our Life	t	170	274	15
689	Ellen Hunnicutt	Ellen	Hunnicutt	female	\N	graduate	\N	winner	University of Pittsburg Press	Drue Heinz Literature Prize	1987	prose	book	15000	In The Music Library	t	225	271	4
705	Eric McHenry	Eric	McHenry	male	\N	graduate	\N	winner	Claremont Graduate University	Kate Tufts Discovery Award 	2007	poetry	book	10000	Potscrubber Lullabies	t	321	454	10
712	Ernest Hemingway	Ernest	Hemingway	male	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1953	prose	book	15000	The Old Man And The Sea	t	210	414	15
714	Ernest Poole	Ernest	Poole	male	Princeton University	\N	\N	winner	Columbia University	Pulitzer Prize	1918	prose	book	15000	His Family 	t	400	246	15
720	Eudora Welty	Eudora	Welty	female	Columbia University	graduate	\N	winner	Columbia University	Pulitzer Prize	1973	prose	book	15000	The Optimists Daughter	t	540	637	15
720	Eudora Welty	Eudora	Welty	female	Columbia University	graduate	\N	winner	National Book Foundation	National Book Award	1983	prose	book	10000	The Collected Stories Of Eudora Welty	t	540	352	14
733	Fanny Howe	Fanny	Howe	female	Stanford University	\N	\N	winner	Academy of American Poets	Lenore Marshall Poetry Prize	2001	poetry	book	25000	Selected Poems	t	223	266	13
740	Flannery OConnor	Flannery	OConnor	female	\N	graduate	University of Iowa	winner	National Book Foundation	National Book Award	1972	prose	book	10000	The Complete Stories	t	369	562	14
741	Forrest Gander	Forrest	Gander	male	\N	graduate	\N	winner	Columbia University	Pulitzer Prize	2019	poetry	book	15000	Be With	t	163	65	15
751	Frank Bidart	Frank	Bidart	male	Harvard University	graduate	\N	winner	Columbia University	Pulitzer Prize	2018	poetry	book	15000	Half-Light: Collected Poems 1965-2016.	t	41	239	15
751	Frank Bidart	Frank	Bidart	male	Harvard University	graduate	\N	winner	National Book Foundation	National Book Award	2017	poetry	book	10000	Half-Light: Collected Poems 1965-2016	t	41	237	14
757	Frank OHara	Frank	OHara	male	Harvard University	graduate	\N	winner	National Book Foundation	National Book Award	1972	poetry	book	10000	The Collected Poems Of Frank OHara	t	371	348	14
764	Franz Wright	Franz	Wright	male	\N	\N	\N	winner	Columbia University	Pulitzer Prize	2004	poetry	book	15000	Walking To Marthas Vineyard	t	566	438	15
769	Frederick Buechner	Frederick	Buechner	male	Princeton University	\N	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1959	prose	book	10000	The Return Of Ansel Gibbs	t	66	645	17
771	Frederick Crews	Frederick	Crews	male	Yale University Princeton University	graduate	\N	winner	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	1993	prose	book	15000	The Critics Bear It Away: American Fiction And The Academy 	t	98	566	2
776	Gabriel Brownstein	Gabriel	Brownstein	male	Columbia University	graduate	Columbia University	winner	PEN America	Hemingway Award for Debut Novel	2003	prose	book	10000	The Curious Case Of Benjamin Button Apt. 3W	t	64	353	8
780	Galway Kinnell	Galway	Kinnell	male	Princeton University	graduate	\N	winner	National Book Foundation	National Book Award	1983	poetry	book	10000	Selected Poems	t	251	336	14
786	Gary Snyder	Gary	Snyder	male	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1975	poetry	book	15000	Turtle Island	t	468	428	15
788	Gayle Brandeis	Gayle	Brandeis	female	\N	graduate	Antioch College	winner	PEN America	Bellwether Prize for Socially Engaged Fiction	2002	prose	book	25000	The Book Of Dead Birds	t	54	538	1
795	Geoffrey Becker	Geoffrey	Becker	male	\N	\N	\N	winner	University of Pittsburg Press	Drue Heinz Literature Prize	1995	prose	book	15000	Dangerous Men	t	30	113	4
800	George Dillon	George	Dillon	male	University of Chicago	\N	\N	winner	Columbia University	Pulitzer Prize	1932	poetry	book	15000	The Flowering Stone	t	118	406	15
806	George Oppen	George	Oppen	male	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1969	poetry	book	15000	Of Being Numerous	t	378	404	15
808	George Starbuck	George	Starbuck	male	\N	\N	\N	winner	Academy of American Poets	Lenore Marshall Poetry Prize	1983	poetry	book	25000	The Argot Merchant Disaster	t	480	526	13
810	Gerald Stern	Gerald	Stern	male	Columbia University	graduate	\N	winner	National Book Foundation	National Book Award	1998	poetry	book	10000	This Time: New And Selected Poems	t	485	706	14
812	Geraldine Brooks	Geraldine	Brooks	female	Columbia University	graduate	\N	winner	Columbia University	Pulitzer Prize	2006	prose	book	15000	March	t	59	329	15
818	Gina Berriault	Gina	Berriault	female	\N	\N	\N	winner	PEN America	Faulkner Award for Fiction	1997	prose	book	15000	Women In Their Beds	t	39	741	5
824	Gloria Naylor	Gloria	Naylor	female	Yale University	graduate	\N	winner	National Book Foundation	National Book Award	1983	prose	book	10000	The Women Of Brewster Place	t	354	684	14
836	Gregory Pardlo	Gregory	Pardlo	male	\N	graduate	New York University	winner	Columbia University	Pulitzer Prize	2015	poetry	book	15000	Digest	t	382	172	15
842	Gwendolyn Brooks	Gwendolyn	Brooks	female	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1950	poetry	book	15000	Annie Allen	t	60	52	15
843	H. L. Davis	H. L.	Davis	male	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1936	prose	book	15000	Honey In The Horn	t	105	250	15
844	Ha Jin	Ha	Jin	male	\N	graduate	\N	winner	PEN America	Hemingway Award for Debut Novel	1997	prose	book	10000	Ocean Of Words	t	232	747	8
844	Ha Jin	Ha	Jin	male	\N	graduate	\N	winner	PEN America	Faulkner Award for Fiction	2005	prose	book	15000	War Trash	t	232	1395	5
844	Ha Jin	Ha	Jin	male	\N	graduate	\N	winner	National Book Foundation	National Book Award	1999	prose	book	10000	Waiting	t	232	728	14
853	Hannah Tinti	Hannah	Tinti	female	\N	\N	\N	winner	Center for Fiction	First Novel Prize	2008	prose	book	15000	The Good Thief	t	509	590	6
854	Hannahlillith Assadi	Hannahlillith	Assadi	female	Columbia University	graduate	Columbia University	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	2018	prose	book	10000	Sonora	t	21	494	17
855	Hanya Yanagihara	Hanya	Yanagihara	female	\N	\N	\N	winner	Kirkus Review	Kirkus Prize	2015	prose	book	50000	A Little Life	t	571	1421	12
858	Harper Lee	Harper	Lee	female	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1961	prose	book	15000	To Kill A Mockingbird	t	270	717	15
859	Harriet Doerr	Harriet	Doerr	female	\N	\N	\N	winner	National Book Foundation	National Book Award	1984	prose	book	10000	Stones For Ibarra	t	121	512	14
869	Hayden Carruth	Hayden	Carruth	male	University of Chicago	graduate	\N	winner	National Book Foundation	National Book Award	1996	poetry	book	10000	Scrambled Eggs & Whiskey: Poems 1991-1995	t	71	472	14
869	Hayden Carruth	Hayden	Carruth	male	University of Chicago	graduate	\N	winner	Academy of American Poets	Lenore Marshall Poetry Prize	1979	poetry	book	25000	Brothers I Loved You All	t	71	94	13
871	Heidi Durrow	Heidi	Durrow	female	Stanford University Columbia University	graduate	\N	winner	PEN America	Bellwether Prize for Socially Engaged Fiction	2008	prose	book	25000	The Girl Who Fell From The Sky	t	128	584	1
874	Heidy Steidlmayer	Heidy	Steidlmayer	female	\N	graduate	Warren Wilson College	winner	Claremont Graduate University	Kate Tufts Discovery Award 	2013	poetry	book	10000	Fowling Piece	t	482	219	10
880	Henri Cole	Henri	Cole	male	Columbia University	graduate	Columbia University	winner	Claremont Graduate University	Kingsley Tufts Poetry Award	2004	poetry	book	100000	Middle Earth	t	88	337	11
880	Henri Cole	Henri	Cole	male	Columbia University	graduate	Columbia University	winner	Academy of American Poets	Lenore Marshall Poetry Prize	2008	poetry	book	25000	Blackbird And Wolf	t	88	80	13
884	Henry Taylor	Henry	Taylor	male	\N	graduate	\N	winner	Columbia University	Pulitzer Prize	1986	poetry	book	15000	The Flying Change: Poems	t	502	407	15
892	Herman Wouk	Herman	Wouk	male	Columbia University	\N	\N	winner	Columbia University	Pulitzer Prize	1952	prose	book	15000	The Caine Mutiny	t	563	553	15
898	Hillary Jordan	Hillary	Jordan	female	Columbia University	graduate	Columbia University	winner	PEN America	Bellwether Prize for Socially Engaged Fiction	2006	prose	book	25000	Mudbound	t	241	363	1
900	Hisham Matar	Hisham	Matar	female	\N	\N	\N	winner	PEN America	Jean Stein Book Award	2017	no genre	book	75000	The Return: Fathers Sons And The Land In Between	t	308	647	9
905	Howard Moss	Howard	Moss	male	\N	\N	\N	winner	Academy of American Poets	Lenore Marshall Poetry Prize	1986	poetry	book	25000	New Selected Poems	t	346	379	13
905	Howard Moss	Howard	Moss	male	\N	\N	\N	winner	National Book Foundation	National Book Award	1972	poetry	book	10000	Selected Poems	t	346	478	14
907	Howard Nemerov	Howard	Nemerov	male	Harvard University	graduate	\N	winner	National Book Foundation	National Book Award	1978	poetry	book	10000	The Collected Poems Of Howard Nemerov	t	356	349	14
907	Howard Nemerov	Howard	Nemerov	male	Harvard University	graduate	\N	winner	Columbia University	Pulitzer Prize	1978	poetry	book	15000	Collected Poems	t	356	748	15
915	Ian Buruma	Ian	Buruma	male	\N	\N	\N	winner	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	2015	prose	book	15000	Theater Of Cruelty: Art Film And The Shadows Of War	t	68	417	2
920	Imbolo Mbue	Imbolo	Mbue	female	Columbia University	graduate	\N	winner	PEN America	Faulkner Award for Fiction	2017	prose	book	15000	Behold The Dreamers	t	311	67	5
933	Ishmael Reed	Ishmael	Reed	male	\N	\N	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1975	prose	book	10000	The Last Days Of Louisiana Red	t	414	610	17
936	Ivan Gold	Ivan	Gold	male	Columbia University	\N	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1964	prose	book	10000	Nickel Miseries	t	173	381	17
943	J. F. Powers	J. F.	Powers	male	\N	\N	\N	winner	National Book Foundation	National Book Award	1963	prose	book	10000	Morte DUrban	t	404	129	14
948	Jack Livings	Jack	Livings	male	\N	graduate	University of Iowa	winner	PEN America	Robert W. Bingham Prize for Debut Short Story Collection	2015	prose	book	25000	The Dog	t	283	572	16
956	Jaimy Gordon	Jaimy	Gordon	female	Brown University	graduate	\N	winner	National Book Foundation	National Book Award	2010	prose	book	10000	Lord Of Misrule	t	175	315	14
961	James Alan McPherson	James Alan	McPherson	male	Harvard University	graduate	University of Iowa	winner	Columbia University	Pulitzer Prize	1978	prose	book	15000	Elbow Room	t	325	119	15
966	James Dickey	James	Dickey	male	\N	\N	\N	winner	National Book Foundation	National Book Award	1966	poetry	book	10000	Buckdancers Choice: Poems	t	114	95	14
970	James Gould Cozzens	James Gould	Cozzens	male	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1949	prose	book	15000	Guard Of Honor	t	97	236	15
972	James Hannaham	James	Hannaham	male	Yale University	\N	\N	winner	PEN America	Faulkner Award for Fiction	2016	prose	book	15000	Delicious Foods	t	197	167	5
976	James Jones	James	Jones	male	\N	\N	\N	winner	National Book Foundation	National Book Award	1952	prose	book	10000	From Here To Eternity	t	239	221	14
979	James McBride	James	McBride	male	Columbia University	graduate	\N	winner	National Book Foundation	National Book Award	2013	prose	book	10000	The Good Lord Bird	t	312	589	14
982	James Merrill	James	Merrill	male	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1977	poetry	book	15000	Divine Comedies	t	328	175	15
982	James Merrill	James	Merrill	male	\N	\N	\N	winner	National Book Foundation	National Book Award	1979	poetry	book	10000	Mirabell: Books Of Number	t	328	346	14
982	James Merrill	James	Merrill	male	\N	\N	\N	winner	National Book Foundation	National Book Award	1967	poetry	book	10000	Nights And Days	t	328	384	14
983	James Michener	James	Michener	male	\N	graduate	\N	winner	Columbia University	Pulitzer Prize	1948	prose	book	15000	Tales Of The Pacific	t	330	517	15
986	James Robison	James	Robison	male	Brown University	graduate	Brown University	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1989	prose	book	10000	The Illustrator	t	424	604	17
987	James Salter	James	Salter	male	\N	\N	\N	winner	PEN America	Faulkner Award for Fiction	1989	prose	book	15000	Dusk	t	434	185	5
989	James Schuyler	James	Schuyler	male	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1981	poetry	book	15000	The Morning Of The Poem	t	440	628	15
994	James Tate	James	Tate	male	\N	graduate	University of Iowa	winner	National Book Foundation	National Book Award	1994	poetry	book	10000	The Worshipful Company Of Fletchers: Poems	t	501	692	14
994	James Tate	James	Tate	male	\N	graduate	University of Iowa	winner	Columbia University	Pulitzer Prize	1992	poetry	book	15000	Selected Poems	t	501	479	15
996	James Wolcott	James	Wolcott	male	\N	\N	\N	winner	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	2014	prose	book	15000	Critical Mass: Four Decades of Essays Reviews Hand Grenades and Hurrahs	t	561	110	2
998	James Wright	James	Wright	male	\N	graduate	\N	winner	Columbia University	Pulitzer Prize	1972	poetry	book	15000	Collected Poems	t	567	102	15
1003	Jane Hamilton	Jane	Hamilton	female	\N	\N	\N	winner	PEN America	Hemingway Award for Debut Novel	1989	prose	book	10000	The Book Of Ruth	t	196	541	8
1007	Jane McCafferty	Jane	McCafferty	female	\N	\N	\N	winner	University of Pittsburg Press	Drue Heinz Literature Prize	1992	prose	book	15000	Director Of The World And Other Stories	t	313	173	4
1009	Jane Smiley	Jane	Smiley	female	\N	graduate	University of Iowa	winner	Columbia University	Pulitzer Prize	1992	prose	book	15000	A Thousand Acres	t	463	25	15
1011	Janet Kauffman	Janet	Kauffman	female	University of Chicago	graduate	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1985	prose	book	10000	Places In The World A Woman Could Walk	t	245	154	17
1013	Janet Peery	Janet	Peery	female	\N	graduate	Wichita State University	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1994	prose	book	10000	Alligator Dance	t	386	42	17
1015	Janice Harrington	Janice	Harrington	female	\N	\N	\N	winner	Claremont Graduate University	Kate Tufts Discovery Award 	2008	poetry	book	10000	Even The Hollow My Body Made Is Gone	t	199	199	10
1030	Jean Guerrero	Jean	Guerrero	female	\N	graduate	Goucher College	winner	PEN America	Fusion Emerging Writers Prize	2016	prose	book	10000	Crux	t	184	111	7
1031	Jean Stafford	Jean	Stafford	female	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1970	prose	book	15000	Collected Stories	t	478	106	15
1033	Jean Valentine	Jean	Valentine	female	Radcliffe College	graduate	\N	winner	National Book Foundation	National Book Award	2004	poetry	book	10000	Door In The Mountain: New And Collected Poems 1965-2003	t	518	180	14
1035	Jeff Talarigo	Jeff	Talarigo	male	\N	\N	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	2005	prose	book	10000	The Pearl Diver	t	497	640	17
1038	Jeffrey Eugenides	Jeffrey	Eugenides	male	Brown University Stanford University	graduate	\N	winner	Columbia University	Pulitzer Prize	2003	prose	book	15000	Middlesex	t	140	124	15
1046	Jennifer Clarvoe	Jennifer	Clarvoe	female	Princeton University	graduate	\N	winner	Claremont Graduate University	Kate Tufts Discovery Award 	2001	poetry	book	10000	Invisible Tender	t	83	287	10
1048	Jennifer Cornell	Jennifer	Cornell	female	Cornell University	graduate	\N	winner	University of Pittsburg Press	Drue Heinz Literature Prize	1994	prose	book	15000	Departures	t	95	169	4
1049	Jennifer Egan	Jennifer	Egan	female	University of Pennsylvania	graduate	\N	winner	Columbia University	Pulitzer Prize	2011	prose	book	15000	A Visit From The Goon Squad	t	132	27	15
1050	Jennifer Haigh	Jennifer	Haigh	female	\N	graduate	University of Iowa	winner	PEN America	Hemingway Award for Debut Novel	2004	prose	book	10000	Mrs. Kimble	t	190	137	8
1057	Jericho Brown	Jericho	Brown	male	\N	graduate	University of New Orleans	winner	Columbia University	Pulitzer Prize	2020	poetry	book	15000	The Tradition	t	61	670	15
1058	Jerome Charyn	Jerome	Charyn	male	Columbia University	\N	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1981	prose	book	10000	Darlin Bill	t	75	114	17
1060	Jerzy Kosinski	Jerzy	Kosinski	male	Columbia University	graduate	\N	winner	National Book Foundation	National Book Award	1969	prose	book	10000	Steps	t	261	507	14
1061	Jesmyn Ward	Jesmyn	Ward	female	Stanford University	graduate	University of Michigan	winner	National Book Foundation	National Book Award	2011	prose	book	10000	Salvage The Bones	t	535	166	14
1061	Jesmyn Ward	Jesmyn	Ward	female	Stanford University	graduate	University of Michigan	winner	National Book Foundation	National Book Award	2017	prose	book	10000	Sing Unburied Sing	t	535	489	14
1068	Jhumpa Lahiri	Jhumpa	Lahiri	female	Barnard College	graduate	Boston University	winner	PEN America	Hemingway Award for Debut Novel	2000	prose	book	10000	Interpreter Of Maladies	t	266	284	8
1080	Joan Chase	Joan	Chase	female	\N	\N	\N	winner	PEN America	Hemingway Award for Debut Novel	1984	prose	book	10000	During The Reign Of The Queen Of Persia	t	76	184	8
1085	Joan Silber	Joan	Silber	female	\N	graduate	\N	winner	PEN America	Hemingway Award for Debut Novel	1981	prose	book	10000	Household Words	t	453	253	8
1085	Joan Silber	Joan	Silber	female	\N	graduate	\N	winner	PEN America	Faulkner Award for Fiction	2018	prose	book	15000	Improvement	t	453	262	5
1087	Joanie Mackowski	Joanie	Mackowski	female	Stanford University	graduate	University of Washington	winner	Claremont Graduate University	Kate Tufts Discovery Award 	2003	poetry	book	10000	The Zoo	t	296	416	10
1090	Joanna Scott	Joanna	Scott	female	Brown University	graduate	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1991	prose	book	10000	Arrogance	t	441	54	17
1102	John Ashberry	John	Ashberry	male	Harvard University Columbia University	graduate	\N	winner	Columbia University	Pulitzer Prize	1976	poetry	book	15000	Self-Portrait In A Convex Mirror	t	19	481	15
1103	John Ashbery	John	Ashbery	male	Harvard University Columbia University	graduate	\N	winner	National Book Foundation	National Book Award	1976	poetry	book	10000	Self-Portrait In A Convex Mirror	t	20	487	14
1103	John Ashbery	John	Ashbery	male	Harvard University Columbia University	graduate	\N	winner	Academy of American Poets	Lenore Marshall Poetry Prize	1985	poetry	book	25000	A Wave	t	20	28	13
1106	John Barth	John	Barth	male	\N	graduate	\N	winner	National Book Foundation	National Book Award	1973	prose	book	10000	Augustus	t	29	61	14
1108	John Berryman	John	Berryman	male	Columbia University	\N	\N	winner	Columbia University	Pulitzer Prize	1965	poetry	book	15000	77 Dream Songs	t	40	1492	15
1108	John Berryman	John	Berryman	male	Columbia University	\N	\N	winner	National Book Foundation	National Book Award	1969	poetry	book	10000	His Toy His Dream His Rest	t	40	247	14
1111	John Blair	John	Blair	male	\N	graduate	\N	winner	University of Pittsburg Press	Drue Heinz Literature Prize	2002	prose	book	15000	American Standard	t	43	45	4
1114	John Casey	John	Casey	male	Harvard University	graduate	University of Iowa	winner	National Book Foundation	National Book Award	1989	prose	book	10000	Spartina	t	72	498	14
1116	John Cheever	John	Cheever	male	\N	\N	\N	winner	National Book Foundation	National Book Award	1958	prose	book	10000	The Wapshot Chronicle	t	77	685	14
1116	John Cheever	John	Cheever	male	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1979	prose	book	15000	The Stories Of John Cheever	t	77	663	15
1118	John Crowe Ransom	John Crowe	Ransom	male	\N	graduate	\N	winner	National Book Foundation	National Book Award	1964	poetry	book	10000	Selected Poems	t	411	477	14
1122	John Edgar Wideman	John Edgar	Wideman	male	University of Pennsylvania	graduate	University of Iowa	winner	PEN America	Faulkner Award for Fiction	1991	prose	book	15000	Philadelphia Fire	t	545	151	5
1122	John Edgar Wideman	John Edgar	Wideman	male	University of Pennsylvania	graduate	University of Iowa	winner	PEN America	Faulkner Award for Fiction	1984	prose	book	15000	The Old Forest And Other Stories	t	545	636	5
1123	John Edwards Williams	John Edwards	Williams	male	\N	graduate	\N	winner	National Book Foundation	National Book Award	1973	prose	book	10000	Chimera	t	551	851	14
1128	John Gould Fletcher	John Gould	Fletcher	male	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1939	poetry	book	15000	Selected Poems	t	153	265	15
1132	John Haines	John	Haines	male	\N	\N	\N	winner	Academy of American Poets	Lenore Marshall Poetry Prize	1991	poetry	book	25000	New Poems 1980-88	t	191	377	13
1136	John Hersey	John	Hersey	male	Yale University	graduate	\N	winner	Columbia University	Pulitzer Prize	1945	prose	book	15000	A Bell For Adano	t	212	1517	15
1142	John Irving	John	Irving	male	\N	graduate	University of Iowa	winner	National Book Foundation	National Book Award	1980	prose	book	10000	The World According To Garp	t	226	686	14
1146	John Knowles	John	Knowles	male	Yale University	\N	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1961	prose	book	10000	A Separate Peace	t	255	23	17
1147	John Koethe	John	Koethe	male	Princeton University Harvard University	graduate	\N	winner	Academy of American Poets	Lenore Marshall Poetry Prize	2010	poetry	book	25000	Ninety-Fifth Street	t	258	387	13
1147	John Koethe	John	Koethe	male	Princeton University Harvard University	graduate	\N	winner	Claremont Graduate University	Kingsley Tufts Poetry Award	1998	poetry	book	100000	Falling Water	t	258	209	11
1151	John Logan	John	Logan	male	\N	graduate	\N	winner	Academy of American Poets	Lenore Marshall Poetry Prize	1982	poetry	book	25000	The Bridge Of Change: Poems 1974-1980	t	284	545	13
1154	John Marquand	John	Marquand	male	Harvard University	\N	\N	winner	Columbia University	Pulitzer Prize	1938	prose	book	15000	The Late George Apley	t	302	612	15
1162	John OHara	John	OHara	male	\N	\N	\N	winner	National Book Foundation	National Book Award	1956	prose	book	10000	Ten North Frederick	t	372	519	14
1164	John Pipkin	John	Pipkin	male	\N	graduate	\N	winner	Center for Fiction	First Novel Prize	2009	prose	book	15000	Woodsburner	t	397	742	6
1167	John Steinbeck	John	Steinbeck	male	Stanford University	\N	\N	winner	Columbia University	Pulitzer Prize	1940	prose	book	15000	The Grapes Of Wrath	t	483	592	15
1168	John Updike	John	Updike	male	Harvard University	\N	\N	winner	PEN America	Faulkner Award for Fiction	2004	prose	book	15000	The Early Stories 1953-1975	t	517	577	5
1168	John Updike	John	Updike	male	Harvard University	\N	\N	winner	National Book Foundation	National Book Award	1964	prose	book	10000	The Centaur	t	517	555	14
1168	John Updike	John	Updike	male	Harvard University	\N	\N	winner	Columbia University	Pulitzer Prize	1991	prose	book	15000	Rabbit At Rest	t	517	158	15
1168	John Updike	John	Updike	male	Harvard University	\N	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1960	prose	book	10000	The Poorhouse Fair	t	517	648	17
1168	John Updike	John	Updike	male	Harvard University	\N	\N	winner	National Book Foundation	National Book Award	1982	prose	book	10000	Rabbit Is Rich	t	517	464	14
1185	Jonathan Franzen	Jonathan	Franzen	male	\N	\N	\N	winner	National Book Foundation	National Book Award	2001	prose	book	10000	The Corrections	t	159	565	14
1189	Jonathan Penner	Jonathan	Penner	male	\N	graduate	University of Iowa	winner	University of Pittsburg Press	Drue Heinz Literature Prize	1983	prose	book	15000	Private Parties	t	387	156	4
1190	Jonathan Safran Foer	Jonathan Safran	Foer	male	Princeton University	\N	\N	winner	PEN America	Robert W. Bingham Prize for Debut Short Story Collection	2004	prose	book	25000	Everything Is Illuminated	t	154	201	16
1192	Jonathan Strong	Jonathan	Strong	male	Harvard University	\N	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1970	prose	book	10000	Tike And Five Stories	t	491	708	17
1198	Jorie Graham	Jorie	Graham	female	\N	graduate	University of Iowa	winner	Columbia University	Pulitzer Prize	1996	poetry	book	15000	The Dream of the Unified Field	t	176	575	15
1216	Joseph ONeill	Joseph	ONeill	male	\N	graduate	\N	winner	PEN America	Faulkner Award for Fiction	2009	prose	book	15000	Netherland	t	377	373	5
1218	Joseph Skibell	Joseph	Skibell	male	\N	graduate	University of Texas Austin	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1998	prose	book	10000	A Blessing On The Moon	t	459	1521	17
1223	Josephine Humphreys	Josephine	Humphreys	female	Yale University	graduate	\N	winner	PEN America	Hemingway Award for Debut Novel	1985	prose	book	10000	Dreams Of Sleep	t	224	182	8
1224	Josephine Jacobsen	Josephine	Jacobsen	female	\N	\N	\N	winner	Academy of American Poets	Lenore Marshall Poetry Prize	1988	poetry	book	25000	The Sisters: New & Selected Poems	t	228	656	13
1225	Josephine Johnson	Josephine	Johnson	female	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1935	prose	book	15000	Now In November	t	237	402	15
1226	Josephine Miles	Josephine	Miles	female	\N	graduate	\N	winner	Academy of American Poets	Lenore Marshall Poetry Prize	1984	poetry	book	25000	Collected Poems 1930-83	t	331	135	13
1227	Joshua Ferris	Joshua	Ferris	male	\N	graduate	Univeristy of California Irvine	winner	PEN America	Hemingway Award for Debut Novel	2008	prose	book	10000	Then We Came To The End	t	147	694	8
1240	Julia Glass	Julia	Glass	female	Yale University	\N	\N	winner	National Book Foundation	National Book Award	2002	prose	book	10000	Three Junes	t	171	1435	14
1241	Julia Peterkin	Julia	Peterkin	female	\N	graduate	\N	winner	Columbia University	Pulitzer Prize	1929	prose	book	15000	Scarlet Sister Mary	t	391	471	15
1246	Julie Otsuka	Julie	Otsuka	female	Yale University Columbia University	graduate	Columbia University	winner	PEN America	Faulkner Award for Fiction	2012	prose	book	15000	The Buddha In The Attic	t	380	552	5
1248	Junot Diaz	Junot	Diaz	male	Cornell University	graduate	Cornell University	winner	Center for Fiction	First Novel Prize	2007	prose	book	15000	The Brief Wondrous Life Of Oscar Wao	t	113	549	6
1249	Justin Cronin	Justin	Cronin	male	Harvard University	graduate	University of Iowa	winner	PEN America	Hemingway Award for Debut Novel	2002	prose	book	10000	Mary And ONeil	t	100	333	8
1250	Justin Phillip Reed	Justin Phillip	Reed	male	\N	\N	\N	winner	National Book Foundation	National Book Award	2018	poetry	book	10000	Indecency	t	415	278	14
1253	Karan Mahajan	Karan	Mahajan	male	Stanford University	graduate	University of Texas Austin	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	2017	prose	book	10000	The Association Of Small Bombs	t	298	529	17
1255	Karen Joy Fowler	Karen Joy	Fowler	female	\N	\N	\N	winner	PEN America	Faulkner Award for Fiction	2014	prose	book	15000	We Are All Completely Beside Ourselves	t	157	442	5
1262	Karl Marlantes	Karl	Marlantes	male	Yale University	graduate	\N	winner	Center for Fiction	First Novel Prize	2010	prose	book	15000	Matterhorn	t	301	334	6
1263	Karl Shapiro	Karl	Shapiro	male	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1945	poetry	book	15000	V-Letter And Other Poems	t	450	434	15
1266	Kate Christensen	Kate	Christensen	female	\N	graduate	University of Iowa	winner	PEN America	Faulkner Award for Fiction	2008	prose	book	15000	The Great Man	t	81	595	5
1272	Kate Wisel	Kate	Wisel	female	\N	graduate	Columba College	winner	University of Pittsburg Press	Drue Heinz Literature Prize	2019	prose	book	15000	Driving In Cars With Homeless Men	t	559	183	4
1274	Katherine Anne Porter	Katherine Anne	Porter	female	\N	\N	\N	winner	National Book Foundation	National Book Award	1966	prose	book	10000	The Collected Stories Of Katherine Anne Porter	t	401	557	14
1274	Katherine Anne Porter	Katherine Anne	Porter	female	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1966	prose	book	15000	Collected Stories	t	401	104	15
1277	Katherine Larson	Katherine	Larson	female	\N	graduate	University of Virginia	winner	Claremont Graduate University	Kate Tufts Discovery Award 	2012	poetry	book	10000	Radial Symmetry	t	268	159	10
1279	Katherine Seligman	Katherine	Seligman	female	Stanford University	graduate	\N	winner	PEN America	Bellwether Prize for Socially Engaged Fiction	2019	prose	book	25000	At The Edge Of The Haight	t	443	57	1
1280	Katherine Vaz	Katherine	Vaz	female	\N	\N	\N	winner	University of Pittsburg Press	Drue Heinz Literature Prize	1997	prose	book	15000	Fado And Other Stories	t	524	203	4
1294	Kay Ryan	Kay	Ryan	female	\N	graduate	\N	winner	Columbia University	Pulitzer Prize	2011	poetry	book	15000	The Best Of It: New And Selected Poems	t	431	535	15
1300	Keith Waldrop	Keith	Waldrop	male	\N	graduate	\N	winner	National Book Foundation	National Book Award	2009	poetry	book	10000	Transcendental Studies: A Trilogy	t	530	720	14
1312	Kent Nelson	Kent	Nelson	male	Yale University	graduate	\N	winner	University of Pittsburg Press	Drue Heinz Literature Prize	2014	prose	book	15000	The Spirit Bird	t	355	659	4
1316	Kevin Powers	Kevin	Powers	male	\N	graduate	University of Texas Austin	winner	PEN America	Hemingway Award for Debut Novel	2013	prose	book	10000	The Yellow Birds	t	405	1354	8
1317	Kevin Young	Kevin	Young	male	Harvard University Brown University Stanford University	graduate	Brown University	winner	Academy of American Poets	Lenore Marshall Poetry Prize	2015	poetry	book	25000	Book Of Hours	t	575	86	13
1321	Kia Corthron	Kia	Corthron	female	Columbia University	graduate	Columbia University	winner	Center for Fiction	First Novel Prize	2016	prose	book	15000	The Castle Cross The Magnet Carter	t	96	344	6
1327	Kirk Nesset	Kirk	Nesset	male	\N	graduate	\N	winner	University of Pittsburg Press	Drue Heinz Literature Prize	2007	prose	book	15000	Paradise Road	t	357	145	4
1332	Kyle Dargan	Kyle	Dargan	male	\N	graduate	Indiana University	winner	Academy of American Poets	Lenore Marshall Poetry Prize	2019	poetry	book	25000	Anagnorisis	t	104	49	13
1345	Larry Heinemann	Larry	Heinemann	male	\N	\N	\N	winner	National Book Foundation	National Book Award	1987	prose	book	10000	Pacos Story	t	207	144	14
1347	Larry McMurtry	Larry	McMurtry	male	Stanford University	graduate	\N	winner	Columbia University	Pulitzer Prize	1986	prose	book	15000	Lonesome Dove	t	324	314	15
1351	Laura Hendrie	Laura	Hendrie	female	\N	\N	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1995	prose	book	10000	Stygo	t	211	514	17
1356	Laura Vandenberg	Laura	Vandenberg	female	\N	graduate	Emerson College	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	2014	prose	book	10000	The Isle Of Youth	t	522	606	17
1364	Lawrence Thornton	Lawrence	Thornton	male	\N	graduate	\N	winner	PEN America	Hemingway Award for Debut Novel	1988	prose	book	10000	Imagining Argentina	t	508	260	8
1366	Layli Long Soldier	Layli	Long Soldier	female	\N	graduate	Bard College	winner	PEN America	Jean Stein Book Award	2018	no genre	book	75000	Whereas	t	287	738	9
1375	Leonard Bacon	Leonard	Bacon	male	Yale University	\N	\N	winner	Columbia University	Pulitzer Prize	1941	poetry	book	15000	Sunderland Capture	t	25	515	15
1379	Leonora Speyer	Leonora	Speyer	female	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1927	poetry	book	15000	Fiddlers Farewell	t	475	212	15
1383	Lesley Nneka Arimah	Lesley Nneka	Arimah	female	\N	graduate	Minnesota State University	winner	Kirkus Review	Kirkus Prize	2017	prose	book	50000	What It Means When A Man Falls From The Sky	t	15	445	12
1388	Leslie Pietrzyk	Leslie	Pietrzyk	female	\N	graduate	American University	winner	University of Pittsburg Press	Drue Heinz Literature Prize	2015	prose	book	15000	This Angel On My Chest	t	395	705	4
1395	Lily King	Lily	King	female	\N	graduate	\N	winner	Kirkus Review	Kirkus Prize	2014	prose	book	50000	Euphoria	t	250	908	12
1396	Lily Tuck	Lily	Tuck	female	Radcliffe College	graduate	\N	winner	National Book Foundation	National Book Award	2004	prose	book	10000	The News From Paraguay	t	514	412	14
1401	Linda Gregerson	Linda	Gregerson	female	Stanford University	graduate	University of Iowa	winner	Claremont Graduate University	Kingsley Tufts Poetry Award	2003	poetry	book	100000	Waterborne	t	181	441	11
1402	Linda Gregg	Linda	Gregg	female	\N	graduate	\N	winner	Academy of American Poets	Lenore Marshall Poetry Prize	2009	poetry	book	25000	All Of It Singing: New And Selected Poems	t	182	36	13
1406	Ling Ma	Ling	Ma 	female	University of Chicago Cornell University	graduate	Cornell University	winner	Kirkus Review	Kirkus Prize	2018	prose	book	50000	Severance	t	293	483	12
1410	Lisa Ko	Lisa	Ko	female	\N	graduate	City College of New York	winner	PEN America	Bellwether Prize for Socially Engaged Fiction	2016	prose	book	25000	The Leavers	t	257	613	1
1413	Lisel Mueller	Lisel	Mueller	female	\N	graduate	\N	winner	Columbia University	Pulitzer Prize	1997	poetry	book	15000	Alive Together: New And Selected Poems	t	348	34	15
1413	Lisel Mueller	Lisel	Mueller	female	\N	graduate	\N	winner	National Book Foundation	National Book Award	1981	poetry	book	10000	The Need To Hold Still: Poems	t	348	632	14
1423	Louis Begley	Louis	Begley	male	Harvard University	graduate	\N	winner	PEN America	Hemingway Award for Debut Novel	1992	prose	book	10000	Wartime Lies	t	31	439	8
1424	Louis Bromfield	Louis	Bromfield	male	Columbia University	\N	\N	winner	Columbia University	Pulitzer Prize	1927	prose	book	15000	Early Autumn	t	55	187	15
1429	Louis Simpson	Louis	Simpson	male	Columbia University	graduate	\N	winner	Columbia University	Pulitzer Prize	1964	poetry	book	15000	At The End Of The Open Road	t	456	60	15
1436	Louise Erdrich	Louise	Erdrich	female	Dartmouth College	graduate	\N	winner	National Book Foundation	National Book Award	2012	prose	book	10000	The Round House	t	138	1315	14
1437	Louise Gluck	Louise	Gluck	female	\N	\N	\N	winner	National Book Foundation	National Book Award	2014	poetry	book	10000	Faithful And Virtuous Night	t	172	208	14
1437	Louise Gluck	Louise	Gluck	female	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1993	poetry	book	15000	The Wild Iris	t	172	689	15
1439	Loyd Little	Loyd	Little	male	\N	\N	\N	winner	PEN America	Hemingway Award for Debut Novel	1976	prose	book	10000	Parthian Shot	t	282	149	8
1443	Lucia Perillo	Lucia	Perillo	female	\N	graduate	\N	winner	Claremont Graduate University	Kingsley Tufts Poetry Award	2006	poetry	book	100000	Luck Is Luck	t	389	322	11
1443	Lucia Perillo	Lucia	Perillo	female	\N	graduate	\N	winner	Claremont Graduate University	Kate Tufts Discovery Award 	1997	poetry	book	10000	The Body Mutinies	t	389	537	10
1445	Lucille Clifton	Lucille	Clifton	female	\N	\N	\N	winner	National Book Foundation	National Book Award	2000	poetry	book	10000	Blessing The Boats: New And Selected Poems 1988-2000	t	84	81	14
1447	Lucy Honig	Lucy	Honig	female	\N	graduate	\N	winner	University of Pittsburg Press	Drue Heinz Literature Prize	1999	prose	book	15000	The Truly Needy And Other Stories	t	221	674	4
1460	Lynn Emmanuel	Lynn	Emmanuel	female	\N	graduate	University of Iowa	winner	Academy of American Poets	Lenore Marshall Poetry Prize	2016	poetry	book	25000	The Nerve Of It: Poems New And Selected	t	137	411	13
1468	Mackinlay Kantor	Mackinlay	Kantor	male	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1956	prose	book	15000	Andersonville	t	244	51	15
1470	Madeline Defrees	Madeline	Defrees	female	\N	graduate	\N	winner	Academy of American Poets	Lenore Marshall Poetry Prize	2002	poetry	book	25000	Blue Dusk	t	108	84	13
1473	Margaret Ayer Barnes	Margaret Ayer	Barnes	female	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1931	prose	book	15000	Years Of Grace	t	27	458	15
1476	Maile Meloy	Maile	Meloy	female	Harvard University	graduate	Univeristy of California Irvine	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	2003	prose	book	10000	Half In Love	t	326	238	17
1482	Manil Suri	Manil	Suri	male	\N	graduate	\N	winner	PEN America	Robert W. Bingham Prize for Debut Short Story Collection	2002	prose	book	25000	The Death Of Vishnu	t	494	357	16
1493	Margaret Mitchell	Margaret	Mitchell	female	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1937	prose	book	15000	Gone With The Wind	t	335	229	15
1495	Margaret Widdemer	Margaret	Widdemer	female	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1919	poetry	book	15000	Old Road To Paradise	t	544	138	15
1496	Margaret Wilson	Margaret	Wilson	female	University of Chicago	graduate	\N	winner	Columbia University	Pulitzer Prize	1924	prose	book	15000	The Able Mclaughlins	t	555	522	15
1497	Margaret Wrinkle	Margaret	Wrinkle	female	Yale University	graduate	\N	winner	Center for Fiction	First Novel Prize	2013	prose	book	15000	Wash	t	569	440	6
1503	Marianne Boruch	Marianne	Boruch	female	\N	graduate	University of Massachusetts Amherst	winner	Claremont Graduate University	Kingsley Tufts Poetry Award	2013	poetry	book	100000	The Book Of Hours	t	47	540	11
1504	Marianne Moore	Marianne	Moore	female	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1952	poetry	book	15000	Collected Poems	t	339	39	15
1511	Marilyn Hacker	Marilyn	Hacker	female	\N	\N	\N	winner	National Book Foundation	National Book Award	1975	poetry	book	10000	Presentation Piece	t	189	456	14
1511	Marilyn Hacker	Marilyn	Hacker	female	\N	\N	\N	winner	Academy of American Poets	Lenore Marshall Poetry Prize	1995	poetry	book	25000	Winter Numbers	t	189	740	13
1513	Marilynne Robinson	Marilynne	Robinson	female	Brown University	graduate	\N	winner	PEN America	Diamonstein-Spielvogel Award For The Art Of The Essay	1999	prose	book	15000	The Death Of Adam: Essays on Modern Thought	t	423	570	3
1513	Marilynne Robinson	Marilynne	Robinson	female	Brown University	graduate	\N	winner	Columbia University	Pulitzer Prize	2005	prose	book	15000	Gilead	t	423	224	15
1513	Marilynne Robinson	Marilynne	Robinson	female	Brown University	graduate	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1982	prose	book	10000	Housekeeping	t	423	254	17
1516	Marisha Pessl	Marisha	Pessl	female	Barnard College	\N	\N	winner	Center for Fiction	First Novel Prize	2006	prose	book	15000	Special Topics In Calamity Physics	t	390	499	6
1519	Marjorie Kinnan Rawlings	Marjorie Kinnan	Rawlings	female	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1939	prose	book	15000	The Yearling	t	413	690	15
1520	Marjorie Kowalski Cole	Marjorie	Kowalski Cole	female	\N	graduate	\N	winner	PEN America	Bellwether Prize for Socially Engaged Fiction	2004	prose	book	25000	Correcting The Landscape	t	262	109	1
1526	Mark Doty	Mark	Doty	male	\N	graduate	Goddard College	winner	National Book Foundation	National Book Award	2008	poetry	book	10000	Fire To Fire: New And Selected Poems	t	123	214	14
1529	Mark Jarman	Mark	Jarman	male	\N	graduate	University of Iowa	winner	Academy of American Poets	Lenore Marshall Poetry Prize	1998	poetry	book	25000	Questions For Ecclesiastes	t	229	157	13
1535	Mark Richard	Mark	Richard	male	\N	\N	\N	winner	PEN America	Hemingway Award for Debut Novel	1990	prose	book	10000	The Ice At The Bottom Of The World	t	419	600	8
1538	Mark Slouka	Mark	Slouka	male	Columbia University	graduate	\N	winner	PEN America	Diamonstein-Spielvogel Award For The Art Of The Essay	2011	prose	book	15000	Essays From The Nick Of Time: Reflections And Refutations	t	462	197	3
1539	Mark Strand	Mark	Strand	male	Yale University	graduate	University of Iowa	winner	Columbia University	Pulitzer Prize	1999	poetry	book	15000	Blizzard Of One	t	489	82	15
1541	Mark Van Doren	Mark	Van Doren	male	Columbia University	graduate	\N	winner	Columbia University	Pulitzer Prize	1940	poetry	book	15000	Collected Poems	t	520	78	15
1548	Martha Nussbaum	Martha	Nussbaum	female	Harvard University	graduate	\N	winner	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	1991	prose	book	15000	Loves Knowledge: : Essays on Philosophy and Literature	t	363	320	2
1553	Martin Flavin	Martin	Flavin	male	University of Chicago	\N	\N	winner	Columbia University	Pulitzer Prize	1944	prose	book	15000	Journey In The Dark	t	151	292	15
1565	Mary Lee Settle	Mary Lee	Settle	female	\N	graduate	Vermont College of Fine Arts 	winner	National Book Foundation	National Book Award	1978	prose	book	10000	Blood Tie	t	445	83	14
1569	Mary Oliver	Mary	Oliver	female	\N	graduate	\N	winner	Columbia University	Pulitzer Prize	1984	poetry	book	15000	American Primitive	t	374	44	15
1569	Mary Oliver	Mary	Oliver	female	\N	graduate	\N	winner	National Book Foundation	National Book Award	1992	poetry	book	10000	New And Selected Poems (Vol 1 Of Two)	t	374	376	14
1574	Mary Szybist	Mary	Szybist	female	\N	graduate	University of Iowa	winner	National Book Foundation	National Book Award	2013	poetry	book	10000	Incarnadine	t	496	276	14
1575	Mary Ward Brown	Mary Ward	Brown	female	\N	\N	\N	winner	PEN America	Hemingway Award for Debut Novel	1987	prose	book	10000	Tongues Of Flame	t	62	719	8
1577	Marya Zaturenska	Marya	Zaturenska	female	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1938	poetry	book	15000	Cold Morning Sky	t	578	853	15
1578	Marykay Zuravleff	Marykay	Zuravleff	female	\N	graduate	Johns Hopkins University	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1997	prose	book	10000	The Frequency Of Souls	t	579	410	17
1583	Matthea Harvey	Matthea	Harvey	female	Harvard University	graduate	University of Iowa	winner	Claremont Graduate University	Kingsley Tufts Poetry Award	2009	poetry	book	100000	Modern Life	t	200	127	11
1585	Matthew Dickman	Matthew	Dickman	male	\N	graduate	University of Texas Austin	winner	Claremont Graduate University	Kate Tufts Discovery Award 	2009	poetry	book	10000	All-American Poem	t	115	35	10
1586	Matthew Klam	Matthew	Klam	male	\N	graduate	Hollins College	winner	PEN America	Robert W. Bingham Prize for Debut Short Story Collection	2002	prose	book	25000	Sam The Cat And Other Stories	t	253	204	16
1589	Matthew Stadler	Matthew	Stadler	male	Columbia University	graduate	Columbia University	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	2000	prose	book	10000	Allan Stein	t	477	41	17
1601	Maxine Kumin	Maxine	Kumin	female	Radcliffe College	graduate	\N	winner	Columbia University	Pulitzer Prize	1973	poetry	book	15000	Up Country	t	263	433	15
1607	Maya Sonenberg	Maya	Sonenberg	female	Brown University	graduate	\N	winner	University of Pittsburg Press	Drue Heinz Literature Prize	1989	prose	book	15000	Cartographies	t	471	98	4
1619	Melissa Yancy	Melissa	Yancy	female	\N	graduate	University of Southern California	winner	University of Pittsburg Press	Drue Heinz Literature Prize	2016	prose	book	15000	Dog Years	t	572	179	4
1622	Mia Alvar	Mia	Alvar	female	Harvard University Columbia University	graduate	Columbia University	winner	PEN America	Robert W. Bingham Prize for Debut Short Story Collection	2016	prose	book	25000	In The Country: Stories	t	11	269	16
1626	Michael Chabon	Michael	Chabon	male	\N	graduate	Univeristy of California Irvine	winner	Columbia University	Pulitzer Prize	2001	prose	book	15000	The Amazing Adventures Of Kavalier & Clay	t	74	525	15
1628	Michael Cunningham	Michael	Cunningham	male	Stanford University	graduate	University of Iowa	winner	Columbia University	Pulitzer Prize	1999	prose	book	15000	The Hours	t	101	599	15
1641	Michael Ryan	Michael	Ryan	male	\N	graduate	University of Iowa	winner	Academy of American Poets	Lenore Marshall Poetry Prize	1990	poetry	book	25000	God Hunger	t	432	226	13
1641	Michael Ryan	Michael	Ryan	male	\N	graduate	University of Iowa	winner	Claremont Graduate University	Kingsley Tufts Poetry Award	2005	poetry	book	100000	New And Selected Poems	t	432	374	11
1643	Michael Shaara	Michael	Shaara	male	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1975	prose	book	15000	The Killer Angels	t	447	608	15
1651	Michelle Tea	Michelle	Tea	female	\N	\N	\N	winner	PEN America	Diamonstein-Spielvogel Award For The Art Of The Essay	2019	prose	book	15000	Against Memoir: Complaints Confessions & Criticisms	t	505	32	3
1658	Mimi Lok	Mimi	Lok	female	\N	graduate	San Francisco State University	winner	PEN America	Robert W. Bingham Prize for Debut Short Story Collection	2020	prose	book	10000	Last Of Her Name	t	285	302	16
1672	Mona Van Duyn	Mona	Van Duyn	female	\N	graduate	\N	winner	National Book Foundation	National Book Award	1971	poetry	book	10000	To See To Take: Poems	t	521	718	14
1672	Mona Van Duyn	Mona	Van Duyn	female	\N	graduate	\N	winner	Columbia University	Pulitzer Prize	1991	poetry	book	15000	Near Changes	t	521	368	15
1674	Monique Truong	Monique	Truong	female	Yale University	graduate	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	2011	prose	book	10000	Bitter In The Mouth	t	513	77	17
1674	Monique Truong	Monique	Truong	female	Yale University	graduate	\N	winner	PEN America	Robert W. Bingham Prize for Debut Short Story Collection	2004	prose	book	25000	The Book Of Salt	t	513	544	16
1683	N. Scott Momaday	N. Scott	Momaday	male	Stanford University	graduate	\N	winner	Columbia University	Pulitzer Prize	1969	prose	book	15000	House Made Of Dawn	t	338	252	15
1690	Nan Nan	Nan	Nan	female	\N	\N	\N	winner	Center for Fiction	First Novel Prize	2017	prose	book	15000	Mikhail And Margarita	t	353	335	6
1691	Nana Kwame Adjei-Brenyah	Nana Kwame	Adjei-Brenyah	male	\N	graduate	Syracuse University	winner	PEN America	Jean Stein Book Award	2019	no genre	book	75000	Friday Black 	t	4	220	9
1695	Naomi Benaron	Naomi	Benaron	female	\N	graduate	Antioch College	winner	PEN America	Bellwether Prize for Socially Engaged Fiction	2010	prose	book	25000	Naomi BenaronRunning The Rift	t	35	365	1
1703	Natasha Trethewey	Natasha	Trethewey	female	\N	graduate	University of Massachusetts Amherst	winner	Columbia University	Pulitzer Prize	2007	poetry	book	15000	Native Guard	t	512	366	15
1710	Nathaniel Mackey	Nathaniel	Mackey	male	Princeton University Stanford University	graduate	\N	winner	National Book Foundation	National Book Award	2006	poetry	book	10000	Splay Anthem	t	294	503	14
1715	Nelson Algren	Nelson	Algren	male	\N	\N	\N	winner	National Book Foundation	National Book Award	1950	prose	book	10000	The Man With The Golden Arm	t	10	625	14
1722	Nick Arvin	Nick	Arvin	male	Stanford University	graduate	University of Iowa	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	2006	prose	book	10000	Articles Of War	t	18	55	17
1729	Nikky Finney	Nikky	Finney	female	\N	graduate	\N	winner	National Book Foundation	National Book Award	2011	poetry	book	10000	Head Off & Split: Poems	t	149	242	14
1732	No Winner	No Winner	No Winner	No Winner	No Winner	No Winner	No Winner	winner	Columbia University	Pulitzer Prize	1941	prose	book	15000	Sunderland Capture	t	360	516	15
1732	No Winner	No Winner	No Winner	No Winner	No Winner	No Winner	No Winner	winner	Columbia University	Pulitzer Prize	1964	prose	book	15000	No Winner	t	360	388	15
1732	No Winner	No Winner	No Winner	No Winner	No Winner	No Winner	No Winner	winner	Columbia University	Pulitzer Prize	1954	prose	book	15000	The Waking	t	360	681	15
1741	Norman Rush	Norman	Rush	male	\N	\N	\N	winner	National Book Foundation	National Book Award	1991	prose	book	10000	Mating	t	429	1027	14
1741	Norman Rush	Norman	Rush	male	\N	\N	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1987	prose	book	10000	Whites	t	429	739	17
1743	Noviolet Bulawayo	Noviolet	Bulawayo	female	Cornell University Stanford University	graduate	Cornell University	winner	PEN America	Hemingway Award for Debut Novel	2014	prose	book	10000	We Need New Names	t	67	443	8
1748	Oliver La Farge	Oliver	La Farge	male	Harvard University	graduate	\N	winner	Columbia University	Pulitzer Prize	1930	prose	book	15000	Laughing Boy	t	265	304	15
1751	Olympia Vernon	Olympia	Vernon	female	\N	graduate	Louisiana State University	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	2004	prose	book	10000	Eden	t	525	190	17
1755	Oscar Hijuelos	Oscar	Hijuelos	male	\N	graduate	\N	winner	Columbia University	Pulitzer Prize	1990	prose	book	15000	The Mambo Kings Play Songs Of Love	t	214	619	15
1758	Ottessa Moshfegh	Ottessa	Moshfegh	female	Barnard College Brown University Stanford University	graduate	Brown University	winner	PEN America	Hemingway Award for Debut Novel	2016	prose	book	10000	Eileen	t	345	192	8
1770	Patricia Smith	Patricia	Smith	female	\N	graduate	University of Southern Maine	winner	Academy of American Poets	Lenore Marshall Poetry Prize	2013	poetry	book	25000	Shoulda Been Jimi Savannah	t	465	488	13
1770	Patricia Smith	Patricia	Smith	female	\N	graduate	University of Southern Maine	winner	Claremont Graduate University	Kingsley Tufts Poetry Award	2018	poetry	book	100000	Incendiary Art: Poems	t	465	277	11
1775	Patrick Phillips	Patrick	Phillips	male	\N	graduate	University of Maryland	winner	Claremont Graduate University	Kate Tufts Discovery Award 	2005	poetry	book	10000	Chattahoochee	t	393	101	10
1776	Patrick Rosal	Patrick	Rosal	male	\N	graduate	Sarah Lawrence College	winner	Academy of American Poets	Lenore Marshall Poetry Prize	2017	poetry	book	25000	Brooklyn Antediluvian	t	427	93	13
1789	Paul Harding	Paul	Harding	male	\N	graduate	University of Iowa	winner	PEN America	Robert W. Bingham Prize for Debut Short Story Collection	2010	prose	book	25000	Tinkers	t	198	712	16
1793	Paul Muldoon	Paul	Muldoon	male	\N	\N	\N	winner	Columbia University	Pulitzer Prize	2003	poetry	book	15000	Moy Sand And Gravel	t	349	130	15
1806	Paule Marshall	Paule	Marshall	female	\N	\N	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1962	prose	book	10000	Soul Clap Hands And Sing	t	304	496	17
1809	Pearl Buck	Pearl	Buck	female	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1932	prose	book	15000	The Good Earth	t	65	588	15
1814	Pete Dexter	Pete	Dexter	male	\N	\N	\N	winner	National Book Foundation	National Book Award	1988	prose	book	10000	Paris Trout	t	112	147	14
1816	Peter Balakian	Peter	Balakian	male	Brown University	graduate	\N	winner	Columbia University	Pulitzer Prize	2016	poetry	book	15000	Ozone Journal	t	26	143	15
1825	Peter Matthiessen	Peter	Matthiessen	male	Yale University	\N	\N	winner	National Book Foundation	National Book Award	2008	prose	book	10000	Shadow Country	t	309	485	14
1831	Peter Taylor	Peter	Taylor	male	\N	\N	\N	winner	PEN America	Faulkner Award for Fiction	1986	prose	book	15000	The Old Forest And Other Stories	t	503	635	5
1831	Peter Taylor	Peter	Taylor	male	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1987	prose	book	15000	A Summons To Memphis	t	503	24	15
1833	Peter Viereck	Peter	Viereck	male	Harvard University	graduate	\N	winner	Columbia University	Pulitzer Prize	1949	poetry	book	15000	Terror And Decorum	t	528	520	15
1835	Phil Klay	Phil	Klay	male	Dartmouth College	\N	\N	winner	National Book Foundation	National Book Award	2014	prose	book	10000	Redeployment	t	254	162	14
1839	Philip Levine	Philip	Levine	male	Stanford University	graduate	University of Iowa	winner	Academy of American Poets	Lenore Marshall Poetry Prize	1977	poetry	book	25000	The Names Of The Lost	t	276	631	13
1839	Philip Levine	Philip	Levine	male	Stanford University	graduate	University of Iowa	winner	National Book Foundation	National Book Award	1980	poetry	book	10000	Ashes: Poems New And Old	t	276	56	14
1839	Philip Levine	Philip	Levine	male	Stanford University	graduate	University of Iowa	winner	Columbia University	Pulitzer Prize	1995	poetry	book	15000	The Simple Truth	t	276	654	15
1839	Philip Levine	Philip	Levine	male	Stanford University	graduate	University of Iowa	winner	National Book Foundation	National Book Award	1991	poetry	book	10000	What Work Is	t	276	734	14
1843	Philip Roth	Philip	Roth	male	University of Chicago	graduate	\N	winner	Columbia University	Pulitzer Prize	1998	prose	book	15000	American Pastoral	t	428	43	15
1843	Philip Roth	Philip	Roth	male	University of Chicago	graduate	\N	winner	PEN America	Faulkner Award for Fiction	2007	prose	book	15000	Everyman	t	428	202	5
1843	Philip Roth	Philip	Roth	male	University of Chicago	graduate	\N	winner	PEN America	Faulkner Award for Fiction	2001	prose	book	15000	The Human Stain	t	428	603	5
1843	Philip Roth	Philip	Roth	male	University of Chicago	graduate	\N	winner	National Book Foundation	National Book Award	1960	prose	book	10000	Goodbye Columbus	t	428	232	14
1843	Philip Roth	Philip	Roth	male	University of Chicago	graduate	\N	winner	PEN America	Faulkner Award for Fiction	1994	prose	book	15000	Operation Shylock	t	428	421	5
1843	Philip Roth	Philip	Roth	male	University of Chicago	graduate	\N	winner	National Book Foundation	National Book Award	1995	prose	book	10000	Sabbaths Theater	t	428	470	14
1844	Philip Schultz	Philip	Schultz	male	\N	graduate	University of Iowa	winner	Columbia University	Pulitzer Prize	2008	poetry	book	15000	Failure	t	439	207	15
1846	Philip Williams	Philip	Williams	male	\N	graduate	Washington University	winner	Claremont Graduate University	Kate Tufts Discovery Award 	2017	poetry	book	10000	Thief In The Interior	t	552	701	10
1848	Phyllis McGinley	Phyllis	McGinley	female	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1961	poetry	book	15000	Times Three: Selected Verse From Three Decades	t	317	711	15
1861	Rae Armantrout	Rae	Armantrout	female	\N	graduate	San Francisco State University	winner	Columbia University	Pulitzer Prize	2010	poetry	book	15000	Versed	t	16	437	15
1864	Rafi Zabor	Rafi	Zabor	male	\N	\N	\N	winner	PEN America	Faulkner Award for Fiction	1998	prose	book	15000	The Bear Comes Home	t	577	534	5
1866	Ralph Ellison	Ralph	Ellison	male	\N	\N	\N	winner	National Book Foundation	National Book Award	1953	prose	book	10000	Invisible Man	t	135	122	14
1869	Randall Jarrell	Randall	Jarrell	male	\N	graduate	\N	winner	National Book Foundation	National Book Award	1961	poetry	book	10000	The Woman At The Washington Zoo: Poems And Translations	t	230	682	14
1871	Randall Silvis	Randall	Silvis	male	\N	\N	\N	winner	University of Pittsburg Press	Drue Heinz Literature Prize	1984	prose	book	15000	The Luckiest Man In The World	t	454	616	4
1874	Raven Leilani	Raven	Leilani	female	\N	graduate	New York University	winner	Center for Fiction	First Novel Prize	2020	prose	book	15000	Luster	t	272	323	6
1887	Reginald McKnight	Reginald	McKnight	male	\N	graduate	\N	winner	University of Pittsburg Press	Drue Heinz Literature Prize	1988	prose	book	15000	Moustaphas Eclipse	t	322	1039	4
1889	Renata Adler	Renata	Adler	female	Harvard University	graduate	\N	winner	PEN America	Hemingway Award for Debut Novel	1977	prose	book	10000	Speedboat	t	5	501	8
1891	Reuben Bercovitch	Reuben	Bercovitch	unknown	\N	\N	\N	winner	PEN America	Hemingway Award for Debut Novel	1979	prose	book	10000	Hasen	t	36	240	8
1899	Richard Eberhart	Richard	Eberhart	male	Dartmouth College	graduate	\N	winner	Columbia University	Pulitzer Prize	1966	poetry	book	15000	Selected Poems	t	130	474	15
1899	Richard Eberhart	Richard	Eberhart	male	Dartmouth College	graduate	\N	winner	National Book Foundation	National Book Award	1977	poetry	book	10000	Collected Poems 1930-1976: Including 43 New Poems	t	130	134	14
1901	Richard Ford	Richard	Ford	male	\N	graduate	Univeristy of California Irvine	winner	Columbia University	Pulitzer Prize	1996	prose	book	15000	Independence Day	t	155	279	15
1904	Richard Howard	Richard	Howard	male	Columbia University	graduate	\N	winner	Columbia University	Pulitzer Prize	1970	poetry	book	15000	Untitled Subjects	t	222	432	15
1907	Richard Lange	Richard	Lange	male	\N	\N	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	2008	prose	book	10000	Dead Boys: Stories	t	267	116	17
1911	Richard Powers	Richard	Powers	male	\N	graduate	\N	winner	National Book Foundation	National Book Award	2006	prose	book	10000	The Echo Maker	t	406	360	14
1911	Richard Powers	Richard	Powers	male	\N	graduate	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1986	prose	book	10000	Three Farmers On Their Way To A Dance	t	406	709	17
1911	Richard Powers	Richard	Powers	male	\N	graduate	\N	winner	Columbia University	Pulitzer Prize	2019	prose	book	15000	The Overstory	t	406	641	15
1913	Richard Russo	Richard	Russo	male	\N	graduate	University of Arizona	winner	Columbia University	Pulitzer Prize	2002	prose	book	15000	Empire Falls	t	430	194	15
1918	Richard Wilbur	Richard	Wilbur	male	Harvard University	graduate	\N	winner	National Book Foundation	National Book Award	1957	poetry	book	10000	Things Of This World	t	546	702	14
1918	Richard Wilbur	Richard	Wilbur	male	Harvard University	graduate	\N	winner	Columbia University	Pulitzer Prize	1989	poetry	book	15000	New And Collected Poems	t	546	375	15
1919	Richard Wiley	Richard	Wiley	male	\N	graduate	University of Iowa	winner	PEN America	Faulkner Award for Fiction	1987	prose	book	15000	Soldiers In Hiding	t	549	493	5
1920	Richard Yates	Richard	Yates	male	\N	\N	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1976	prose	book	10000	Disturbing The Peace	t	574	174	17
1925	Rick Demarinis	Rick	Demarinis	male	\N	\N	\N	winner	University of Pittsburg Press	Drue Heinz Literature Prize	1986	prose	book	15000	Under The Wheat	t	110	430	4
1927	Rick Hillis	Rick	Hillis	male	Stanford University	graduate	University of Iowa	winner	University of Pittsburg Press	Drue Heinz Literature Prize	1990	prose	book	15000	Limbo River	t	215	311	4
1933	Rigoberto GonzÃ¡lez	Rigoberto	GonzÃ¡lez	male	\N	graduate	University of Arizona	winner	Academy of American Poets	Lenore Marshall Poetry Prize	2014	poetry	book	25000	Unpeopled Eden	t	174	431	13
1938	Rion Amilcar Scott	Rion Amilcar	Scott	male	\N	graduate	George Mason University	winner	PEN America	Robert W. Bingham Prize for Debut Short Story Collection	2017	prose	book	25000	Insurrections	t	442	282	16
1939	Rita Dove	Rita	Dove	female	\N	graduate	University of Iowa	winner	Columbia University	Pulitzer Prize	1987	poetry	book	15000	Thomas And Beula	t	124	707	15
1944	Robert Bly	Robert	Bly	male	Harvard University	graduate	University of Iowa	winner	National Book Foundation	National Book Award	1968	poetry	book	10000	The Light Around The Body	t	46	614	14
1948	Robert Coffin	Robert	Coffin	male	Princeton University	graduate	\N	winner	Columbia University	Pulitzer Prize	1936	poetry	book	15000	Strange Holiness	t	87	513	15
1958	Robert Frost	Robert	Frost	male	Harvard University	\N	\N	winner	Columbia University	Pulitzer Prize	1924	poetry	book	15000	New Hampshire: A Poem With Notes And Grace Notes	t	161	378	15
1958	Robert Frost	Robert	Frost	male	Harvard University	\N	\N	winner	Columbia University	Pulitzer Prize	1943	poetry	book	15000	A Witness Tree	t	161	30	15
1958	Robert Frost	Robert	Frost	male	Harvard University	\N	\N	winner	Columbia University	Pulitzer Prize	1931	poetry	book	15000	Collected Poems	t	161	117	15
1962	Robert Hass	Robert	Hass	male	Stanford University	graduate	\N	winner	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	2013	prose	book	15000	What Light Can Do: Essays on Art Imagination and the Natural World	t	202	733	2
1962	Robert Hass	Robert	Hass	male	Stanford University	graduate	\N	winner	National Book Foundation	National Book Award	2007	poetry	book	10000	Time And Materials: Poems 1997-2005	t	202	710	14
1964	Robert Hillyer	Robert	Hillyer	male	Harvard University	graduate	\N	winner	Columbia University	Pulitzer Prize	1934	poetry	book	15000	Collected Verse	t	216	107	15
1970	Robert Lewis Taylor	Robert Lewis	Taylor	male	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1959	prose	book	15000	The Travels Of Jaimie McPheeters	t	504	671	15
1972	Robert Lowell	Robert	Lowell	male	\N	graduate	\N	winner	National Book Foundation	National Book Award	1960	poetry	book	10000	Life Studies	t	289	308	14
1972	Robert Lowell	Robert	Lowell	male	\N	graduate	\N	winner	Columbia University	Pulitzer Prize	1974	poetry	book	15000	The Dolphin	t	289	574	15
1972	Robert Lowell	Robert	Lowell	male	\N	graduate	\N	winner	Columbia University	Pulitzer Prize	1947	poetry	book	15000	Lord Wearys Castle	t	289	316	15
1980	Robert Penn Warren	Robert Penn	Warren	male	\N	graduate	\N	winner	National Book Foundation	National Book Award	1958	poetry	book	10000	Promises: Poems 1954-1956	t	536	461	14
1980	Robert Penn Warren	Robert Penn	Warren	male	\N	graduate	\N	winner	Columbia University	Pulitzer Prize	1979	poetry	book	15000	Now And Then	t	536	389	15
1980	Robert Penn Warren	Robert Penn	Warren	male	\N	graduate	\N	winner	Columbia University	Pulitzer Prize	1947	prose	book	15000	All The Kings Men	t	536	750	15
1982	Robert Pinsky	Robert	Pinsky	male	Stanford University	graduate	\N	winner	Academy of American Poets	Lenore Marshall Poetry Prize	1997	poetry	book	25000	The Figured Wheel: New And Collected Poems 1966-1996	t	396	405	13
1985	Robert Stone	Robert	Stone	male	Stanford University	graduate	\N	winner	National Book Foundation	National Book Award	1975	prose	book	10000	Dog Soldiers	t	487	178	14
1988	Robert Wrigley	Robert	Wrigley	male	\N	graduate	University of Montana	winner	Claremont Graduate University	Kingsley Tufts Poetry Award	2000	poetry	book	100000	Reign Of Snakes	t	568	163	11
1994	Robin Coste Lewis	Robin Coste	Lewis	female	Harvard University	graduate	New York University	winner	National Book Foundation	National Book Award	2015	poetry	book	10000	Voyage Of The Sable Venus	t	277	727	14
1997	Robley Wilson	Robley	Wilson	male	\N	graduate	University of Iowa	winner	University of Pittsburg Press	Drue Heinz Literature Prize	1982	prose	book	15000	Dancing For Men	t	556	112	4
1999	Rodney Jones	Rodney	Jones	male	\N	graduate	University of North Carolina	winner	Claremont Graduate University	Kingsley Tufts Poetry Award	2007	poetry	book	100000	Salvation Blues	t	240	186	11
2009	Ron Childress	Ron	Childress	male	\N	\N	\N	winner	PEN America	Bellwether Prize for Socially Engaged Fiction	2014	prose	book	25000	And West Is West	t	78	50	1
2018	Rosina Lippi	Rosina	Lippi	female	Princeton University	graduate	\N	winner	PEN America	Hemingway Award for Debut Novel	1999	prose	book	10000	Homestead	t	280	249	8
2019	Ross Gay	Ross	Gay	male	\N	graduate	Sarah Lawrence College	winner	Claremont Graduate University	Kingsley Tufts Poetry Award	2016	poetry	book	100000	Catalog Of Unabashed Gratitude	t	165	99	11
2028	Ruchika Tomar	Ruchika	Tomar	female	Columbia University	graduate	Columbia University	winner	PEN America	Hemingway Award for Debut Novel	2020	prose	book	10000	A Prayer For Travelers	t	510	18	8
2036	Ruth Stone	Ruth	Stone	female	Harvard University	\N	\N	winner	National Book Foundation	National Book Award	2002	poetry	book	10000	In The Next Galaxy	t	488	272	14
2040	Sabina Murray	Sabina	Murray	female	\N	graduate	\N	winner	PEN America	Faulkner Award for Fiction	2003	prose	book	15000	The Caprices	t	350	343	5
2064	Sara Teasdale	Sara	Teasdale	female	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1918	poetry	book	15000	Love Songs	t	506	319	15
2073	Saul Bellow	Saul	Bellow	male	\N	graduate	\N	winner	Columbia University	Pulitzer Prize	1976	prose	book	15000	Humboldts Gift	t	32	258	15
2073	Saul Bellow	Saul	Bellow	male	\N	graduate	\N	winner	National Book Foundation	National Book Award	1971	prose	book	10000	Mr. Sammlers Planet	t	32	359	14
2073	Saul Bellow	Saul	Bellow	male	\N	graduate	\N	winner	National Book Foundation	National Book Award	1954	prose	book	10000	The Adventures Of Augie March	t	32	524	14
2073	Saul Bellow	Saul	Bellow	male	\N	graduate	\N	winner	National Book Foundation	National Book Award	1965	prose	book	10000	Herzog	t	32	957	14
2085	Sergio De La Pava	Sergio	De La Pava	male	\N	graduate	\N	winner	PEN America	Robert W. Bingham Prize for Debut Short Story Collection	2013	prose	book	25000	A Naked Singularity	t	107	17	16
2088	Shannon Cain	Shannon	Cain	female	\N	graduate	Warren Wilson College	winner	University of Pittsburg Press	Drue Heinz Literature Prize	2011	prose	book	15000	The Necessity Of Certain Behaviors	t	70	630	4
2092	Sharon Olds	Sharon	Olds	female	Stanford University Columbia University	graduate	\N	winner	Columbia University	Pulitzer Prize	2013	poetry	book	15000	Stags Leap	t	373	506	15
2093	Shawn Vestal	Shawn	Vestal	male	\N	graduate	Eastern Washington University	winner	PEN America	Robert W. Bingham Prize for Debut Short Story Collection	2014	prose	book	25000	Godforsaken Idaho	t	527	227	16
2100	Sherman Alexie	Sherman	Alexie	male	\N	\N	\N	winner	PEN America	Faulkner Award for Fiction	2010	prose	book	15000	War Dances	t	9	731	5
2104	Shirley Ann Grau	Shirley Ann	Grau	male	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1965	prose	book	15000	The Keepers Of The House	t	177	607	15
2106	Shirley Hazzard	Shirley	Hazzard	female	\N	\N	\N	winner	National Book Foundation	National Book Award	2003	prose	book	10000	The Great Fire	t	205	594	14
2107	Sigrid Nunez	Sigrid	Nunez	female	Barnard College Columbia University	graduate	Columbia University	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1999	prose	book	10000	Mitz	t	362	126	17
2107	Sigrid Nunez	Sigrid	Nunez	female	Barnard College Columbia University	graduate	Columbia University	winner	National Book Foundation	National Book Award	2018	prose	book	10000	The Friend	t	362	585	14
2111	Sinclair Lewis	Sinclair	Lewis  	male	Yale University	\N	\N	winner	Columbia University	Pulitzer Prize	1926	prose	book	15000	Arrowsmith	t	278	827	15
2118	Spencer Holst	Spencer	Holst	male	\N	\N	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1977	prose	book	10000	Spencer Holst Stories	t	220	502	17
2126	Stanley Elkin	Stanley	Elkin	male	\N	graduate	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1980	prose	book	10000	The Living End	t	134	615	17
2127	Stanley Fish	Stanley	Fish	male	University of Pennsylvania Yale University	graduate	\N	winner	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	1994	prose	book	15000	Theres No Such Thing As Free Speech: And Its A Good Thing Too	t	150	700	2
2128	Stanley Kunitz	Stanley	Kunitz	male	Harvard University	graduate	\N	winner	Academy of American Poets	Lenore Marshall Poetry Prize	1980	poetry	book	25000	The Poems Of Stanley Kunitz 1928-1978	t	264	646	13
2128	Stanley Kunitz	Stanley	Kunitz	male	Harvard University	graduate	\N	winner	National Book Foundation	National Book Award	1995	poetry	book	10000	Passing Through: The Later Poems New And Selected	t	264	150	14
2128	Stanley Kunitz	Stanley	Kunitz	male	Harvard University	graduate	\N	winner	Columbia University	Pulitzer Prize	1959	poetry	book	15000	Selected Poems 1928-1958	t	264	484	15
2139	Stephen Dunn	Stephen	Dunn	male	\N	graduate	\N	winner	Columbia University	Pulitzer Prize	2001	poetry	book	15000	Different Hours	t	127	171	15
2145	Stephen Vincent BenÃ©t	Stephen Vincent	BenÃ©t	male	Yale University	graduate	\N	winner	Columbia University	Pulitzer Prize	1944	poetry	book	15000	Western Star	t	33	732	15
2145	Stephen Vincent BenÃ©t	Stephen Vincent	BenÃ©t	male	Yale University	graduate	\N	winner	Columbia University	Pulitzer Prize	1929	poetry	book	15000	John Browns Body	t	33	291	15
2150	Sterling Brown	Sterling	Brown	male	Harvard University	graduate	\N	winner	Academy of American Poets	Lenore Marshall Poetry Prize	1981	poetry	book	25000	The Collected Poems Of Sterling A. Brown	t	63	350	13
2156	Steven Millhauser	Steven	Millhauser	male	Columbia University	\N	\N	winner	Columbia University	Pulitzer Prize	1997	prose	book	15000	Martin Dressler: The Tale Of An American Dreamer	t	334	331	15
2157	Stewart Justman	Stewart	Justman	male	Columbia University	graduate	\N	winner	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	2004	prose	book	15000	Seeds Of Mortality: The Public and Private Worlds of Cancer	t	243	245	2
2158	Stewart ONan	Stewart	ONan	male	Cornell University	graduate	Cornell University	winner	University of Pittsburg Press	Drue Heinz Literature Prize	1993	prose	book	15000	In The Walled City	t	376	273	4
2166	Susan Choi	Susan	Choi	female	Yale University Cornell University	graduate	Cornell University	winner	National Book Foundation	National Book Award	2019	prose	book	10000	Trust Excercise	t	80	427	14
2170	Susan Mitchell	Susan	Mitchell	female	Columbia University	graduate	\N	winner	Claremont Graduate University	Kingsley Tufts Poetry Award	1993	poetry	book	100000	Rapture	t	336	160	11
2172	Susan Nussbaum	Susan	Nussbaum	female	\N	\N	\N	winner	PEN America	Bellwether Prize for Socially Engaged Fiction	2012	prose	book	25000	Good Kings Bad Kings	t	364	230	1
2173	Susan Power	Susan	Power	female	Harvard University	graduate	University of Iowa	winner	PEN America	Hemingway Award for Debut Novel	1995	prose	book	10000	The Grass Dancer	t	403	593	8
2174	Susan Sontag	Susan	Sontag	female	University of Chicago Harvard University	graduate	\N	winner	National Book Foundation	National Book Award	2000	prose	book	10000	In America	t	472	261	14
2180	Susanna Daniel	Susanna	Daniel	female	Columbia University	graduate	University of Iowa	winner	PEN America	Robert W. Bingham Prize for Debut Short Story Collection	2011	prose	book	25000	Stiltsville	t	103	511	16
2186	Suzanne Greenberg	Suzanne	Greenberg	female	\N	graduate	University of Maryland	winner	University of Pittsburg Press	Drue Heinz Literature Prize	2003	prose	book	15000	Speed-Walk And Other Stories	t	179	500	4
2190	Sylvia Plath	Sylvia	Plath	female	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1982	poetry	book	15000	The Collected Poems	t	398	347	15
2192	T. Coraghessan Boyle	T. Coraghessan	Boyle	male	\N	graduate	University of Iowa	winner	PEN America	Faulkner Award for Fiction	1988	prose	book	15000	Worlds End	t	52	449	5
2195	Tanehisi Coates	Tanehisi	Coates	male	\N	\N	\N	winner	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	2016	prose	book	15000	Between The World And Me	t	86	72	2
2200	Ted Kooser	Ted	Kooser	male	\N	graduate	\N	winner	Columbia University	Pulitzer Prize	2005	poetry	book	15000	Delights And Shadows	t	260	118	15
2202	Teju Cole	Teju	Cole	male	Columbia University	graduate	\N	winner	PEN America	Hemingway Award for Debut Novel	2012	prose	book	10000	Open City	t	89	418	8
2205	Terrance Hayes	Terrance	Hayes	male	\N	graduate	University of Pittsburgh	winner	National Book Foundation	National Book Award	2010	poetry	book	10000	Lighthead	t	204	310	14
2213	Theodore Roethke	Theodore	Roethke	male	\N	graduate	\N	winner	National Book Foundation	National Book Award	1959	poetry	book	10000	Words For The Wind: Poems Of Theodore Roethke	t	425	743	14
2213	Theodore Roethke	Theodore	Roethke	male	\N	graduate	\N	winner	Columbia University	Pulitzer Prize	1954	poetry	book	15000	The Waking	t	425	683	15
2213	Theodore Roethke	Theodore	Roethke	male	\N	graduate	\N	winner	National Book Foundation	National Book Award	1965	poetry	book	10000	The Far Field	t	425	383	14
2215	Thom Gunn	Thom	Gunn	male	Stanford University	graduate	\N	winner	Academy of American Poets	Lenore Marshall Poetry Prize	1993	poetry	book	25000	The Man With Night Sweats	t	185	624	13
2217	Thomas Berger	Thomas	Berger	male	\N	graduate	New School for Social Research	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1965	prose	book	10000	Little Big Man	t	37	312	17
2222	Thomas Lux	Thomas	Lux	male	\N	\N	\N	winner	Claremont Graduate University	Kingsley Tufts Poetry Award	1995	poetry	book	100000	Split Horizon	t	292	504	11
2226	Thomas McGrath	Thomas	McGrath	male	\N	graduate	\N	winner	Academy of American Poets	Lenore Marshall Poetry Prize	1989	poetry	book	25000	Selected Poems 1938-1988	t	319	480	13
2227	Thomas McGuane	Thomas	McGuane	male	Stanford University	graduate	Yale University	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1972	prose	book	10000	Bushwhacked Piano	t	320	96	17
2228	Thomas Mcmahon	Thomas	Mcmahon	male	Cornell University	graduate	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1988	prose	book	10000	Loving Little Egypt	t	323	321	17
2229	Thomas Nagel	Thomas	Nagel	male	Yale University Harvard University	graduate	\N	winner	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	1996	prose	book	15000	Other Minds: Critical Essays 1969-1994	t	352	422	2
2230	Thomas Pynchon	Thomas	Pynchon	male	Cornell University	\N	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1967	prose	book	10000	The Crying Of Lot 49	t	408	569	17
2230	Thomas Pynchon	Thomas	Pynchon	male	Cornell University	\N	\N	winner	National Book Foundation	National Book Award	1974	prose	book	10000	Gravitys Rainbow	t	408	235	14
2231	Thomas Rogers	Thomas	Rogers	male	Harvard University	graduate	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1973	prose	book	10000	The Confession Of A Child Of The Century	t	426	564	17
2235	Thomas Stribling	Thomas	Stribling	male	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1933	prose	book	15000	The Store	t	490	662	15
2237	Thomas Williams	Thomas	Williams	male	University of Chicago	graduate	University of Iowa	winner	National Book Foundation	National Book Award	1975	prose	book	10000	The Hair Of Harold Roux	t	553	596	14
2238	Thornton Wilder	Thornton	Wilder	male	Yale University Princeton University	graduate	\N	winner	Columbia University	Pulitzer Prize	1928	prose	book	15000	The Bridge Of San Luis Rey	t	547	546	15
2238	Thornton Wilder	Thornton	Wilder	male	Yale University Princeton University	graduate	\N	winner	National Book Foundation	National Book Award	1968	prose	book	10000	The Eighth Day	t	547	579	14
2242	Tiana Clarke	Tiana	Clarke	female	\N	graduate	Vanderbilt University	winner	Claremont Graduate University	Kate Tufts Discovery Award 	2020	poetry	book	10000	I Cant Talk About The Trees Without The Blood	t	82	259	10
2244	Tim OBrien	Tim	OBrien	male	Harvard University	graduate	\N	winner	National Book Foundation	National Book Award	1979	prose	book	10000	Going After Cacciato	t	367	228	14
2248	Timothy Donnelly	Timothy	Donnelly	male	Columbia University	graduate	Columbia University	winner	Claremont Graduate University	Kingsley Tufts Poetry Award	2012	poetry	book	100000	The Cloud Corporation	t	122	345	11
2252	Tina Hall	Tina	Hall	female	\N	graduate	Bowling Green State University	winner	University of Pittsburg Press	Drue Heinz Literature Prize	2010	prose	book	15000	The Physics Of Imaginary Objects	t	194	643	4
2254	Tiphanie Yanique	Tiphanie	Yanique	female	\N	graduate	University of Houston	winner	Center for Fiction	First Novel Prize	2014	prose	book	15000	Land Of Love And Drowning	t	573	298	6
2255	Tobias Wolff	Tobias	Wolff	male	Stanford University	graduate	\N	winner	PEN America	Faulkner Award for Fiction	1985	prose	book	15000	The Barracks Thief	t	562	533	5
2256	Toby Olson	Toby	Olson	male	\N	graduate	\N	winner	PEN America	Faulkner Award for Fiction	1983	prose	book	15000	The Barracks Thief	t	375	532	5
2257	Todd James Pierce	Todd James	Pierce	male	\N	graduate	Univeristy of California Irvine	winner	University of Pittsburg Press	Drue Heinz Literature Prize	2006	prose	book	15000	Newsworld	t	394	380	4
2260	Tom Cole	Tom	Cole	male	Harvard University	graduate	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1966	prose	book	10000	An End To Chivalry	t	90	47	17
2265	Tom Sleigh	Tom	Sleigh	male	\N	graduate	Johns Hopkins University	winner	Claremont Graduate University	Kingsley Tufts Poetry Award	2008	poetry	book	100000	Space Walk	t	461	497	11
2267	Tommy Orange	Tommy	Orange 	male	\N	graduate	Institute of American Indian Arts	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	2019	prose	book	10000	There There	t	379	695	17
2270	Toni Morrison	Toni	Morrison	female	Cornell University	graduate	\N	winner	Columbia University	Pulitzer Prize	1988	prose	book	15000	Beloved	t	344	69	15
2276	Tracy Smith	Tracy	Smith	female	Harvard University Columbia University Stanford University	graduate	Columbia University	winner	Columbia University	Pulitzer Prize	2012	poetry	book	15000	Life On Mars	t	466	307	15
2282	Tyehimba Jess	Tyehimba	Jess	male	University of Chicago	graduate	New York University	winner	Columbia University	Pulitzer Prize	2017	poetry	book	15000	Olio	t	231	139	15
2284	Upton Sinclair	Upton	Sinclair	male	Columbia University	\N	\N	winner	Columbia University	Pulitzer Prize	1943	prose	book	15000	Dragons Teeth	t	457	181	15
2286	Ursula Leguin	Ursula	Leguin	female	Radcliffe College Columbia University	graduate	\N	winner	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	2018	prose	book	15000	No Time to Spare: Thinking about what Matters	t	271	386	2
2287	Valeria Luiselli	Valeria	Luiselli	female	Columbia University	graduate	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	2020	prose	book	10000	Lost Children Archive	t	290	317	17
2294	Vanessa Veselka	Vanessa	Veselka	female	\N	\N	\N	winner	PEN America	Robert W. Bingham Prize for Debut Short Story Collection	2012	prose	book	25000	Zazen	t	526	460	16
2303	Viet Thanh Nguyen	Viet Thanh	Nguyen	male	\N	graduate	\N	winner	Center for Fiction	First Novel Prize	2015	prose	book	15000	The Sympathizer	t	359	666	6
2304	Vievee Francis	Vievee	Francis	female	\N	graduate	University of Michigan	winner	Claremont Graduate University	Kingsley Tufts Poetry Award	2017	poetry	book	100000	Forest Primeval	t	158	217	11
2305	Vijay Seshadri	Vijay	Seshadri	male	Columbia University	graduate	Columbia University	winner	Columbia University	Pulitzer Prize	2014	poetry	book	15000	3 Sections	t	444	1487	15
2312	W. D. Snodgrass	W. D.	Snodgrass	male	\N	graduate	University of Iowa	winner	Columbia University	Pulitzer Prize	1960	poetry	book	15000	Hearts Needle	t	467	243	15
2315	W. H. Auden	W. H.	Auden	male	\N	\N	\N	winner	National Book Foundation	National Book Award	1956	poetry	book	10000	The Shield Of Achilles	t	22	1318	14
2315	W. H. Auden	W. H.	Auden	male	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1948	poetry	book	15000	The Age Of Anxiety	t	22	752	15
2317	Walker Percy	Walker	Percy	male	\N	\N	\N	winner	National Book Foundation	National Book Award	1962	prose	book	10000	The Moviegoer	t	388	629	14
2320	Wallace Stegner	Wallace	Stegner	male	\N	graduate	\N	winner	National Book Foundation	National Book Award	1977	prose	book	10000	The Spectator Bird	t	481	658	14
2320	Wallace Stegner	Wallace	Stegner	male	\N	graduate	\N	winner	Columbia University	Pulitzer Prize	1972	prose	book	15000	Angel Of Repose	t	481	800	15
2321	Wallace Stevens	Wallace	Stevens	male	Harvard University	graduate	\N	winner	National Book Foundation	National Book Award	1951	poetry	book	10000	The Auroras Of Autumn	t	486	530	14
2321	Wallace Stevens	Wallace	Stevens	male	Harvard University	graduate	\N	winner	National Book Foundation	National Book Award	1955	poetry	book	10000	The Collected Poems Of Wallace Stevens	t	486	556	14
2321	Wallace Stevens	Wallace	Stevens	male	Harvard University	graduate	\N	winner	Columbia University	Pulitzer Prize	1955	poetry	book	15000	Collected Poems	t	486	58	15
2322	Walter Abish	Walter	Abish	male	\N	\N	\N	winner	PEN America	Faulkner Award for Fiction	1981	prose	book	15000	How German Is It?	t	3	257	5
2327	Walter Wetherell	Walter	Wetherell	male	\N	\N	\N	winner	University of Pittsburg Press	Drue Heinz Literature Prize	1985	prose	book	15000	The Man Who Loved Levittown	t	541	623	4
2328	Wanda Coleman	Wanda	Coleman	female	\N	\N	\N	winner	Academy of American Poets	Lenore Marshall Poetry Prize	1999	poetry	book	25000	Bathwater Wine	t	91	63	13
2334	Weike Wang	Weike	Wang	female	Harvard University	\N	\N	winner	PEN America	Hemingway Award for Debut Novel	2018	prose	book	10000	Chemistry	t	534	849	8
2349	Will Heinrich	Will	Heinrich	male	Columbia University	\N	\N	winner	PEN America	Robert W. Bingham Prize for Debut Short Story Collection	2004	prose	book	25000	The Kings Evil	t	208	609	16
2350	Will Mackin	Will	Mackin	male	\N	\N	\N	winner	PEN America	Robert W. Bingham Prize for Debut Short Story Collection	2019	prose	book	25000	Bring Out The Dog	t	295	91	16
2351	Willa Cather	Willa	Cather	female	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1923	prose	book	15000	One Of Ours	t	73	638	15
2358	William Bronk	William	Bronk	male	Dartmouth College	\N	\N	winner	National Book Foundation	National Book Award	1982	poetry	book	10000	Life Supports: New And Collected Poems	t	57	20	14
2359	William Carlos Williams	William Carlos	Williams	male	University of Pennsylvania	\N	\N	winner	National Book Foundation	National Book Award	1950	poetry	book	10000	Selected Poems	t	554	482	14
2359	William Carlos Williams	William Carlos	Williams	male	University of Pennsylvania	\N	\N	winner	Columbia University	Pulitzer Prize	1963	poetry	book	15000	Pictures From Brueghel	t	554	153	15
2361	William Faulkner	William	Faulkner	male	\N	\N	\N	winner	National Book Foundation	National Book Award	1951	prose	book	10000	The Collected Stories Of William Faulkner	t	144	558	14
2361	William Faulkner	William	Faulkner	male	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1955	prose	book	15000	The Reivers	t	144	649	15
2361	William Faulkner	William	Faulkner	male	\N	\N	\N	winner	National Book Foundation	National Book Award	1955	prose	book	10000	A Fable	t	144	5	14
2362	William Gaddis	William	Gaddis	male	\N	\N	\N	winner	National Book Foundation	National Book Award	1976	prose	book	10000	J R	t	162	290	14
2362	William Gaddis	William	Gaddis	male	Harvard University	\N	\N	winner	National Book Foundation	National Book Award	1994	prose	book	10000	A Frolic Of His Own	t	162	746	14
2363	William Gass	William	Gass	male	Cornell University	graduate	\N	winner	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	2003	prose	book	15000	Test Of Time: Essays	t	164	521	2
2367	William Kennedy	William	Kennedy	male	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1984	prose	book	15000	Ironweed	t	248	288	15
2372	William Maxwell	William	Maxwell	male	Harvard University	graduate	\N	winner	National Book Foundation	National Book Award	1982	prose	book	10000	So Long See You Tomorrow	t	310	492	14
2373	William Meredith	William	Meredith	male	Princeton University	\N	\N	winner	Columbia University	Pulitzer Prize	1988	poetry	book	15000	Partial Accounts: New And Selected Poems	t	327	435	15
2373	William Meredith	William	Meredith	male	Princeton University	\N	\N	winner	National Book Foundation	National Book Award	1997	poetry	book	10000	Effort At Speech: New And Selected Poems	t	327	191	14
2380	William Rose BenÃ©t	William Rose	BenÃ©t	male	Yale University	\N	\N	winner	Columbia University	Pulitzer Prize	1942	poetry	book	15000	The Dust Which Is God	t	34	576	15
2381	William Stafford	William	Stafford	male	\N	graduate	\N	winner	National Book Foundation	National Book Award	1963	poetry	book	10000	Traveling Through The Dark	t	479	721	14
2382	William Styron	William	Styron	male	\N	\N	\N	winner	National Book Foundation	National Book Award	1980	prose	book	10000	Sophies Choice	t	493	495	14
2382	William Styron	William	Styron	male	\N	\N	\N	winner	Columbia University	Pulitzer Prize	1968	prose	book	15000	The Confessions Of Nat Turner	t	493	567	15
2383	William T. Vollman	William T.	Vollman	male	Cornell University	\N	\N	winner	National Book Foundation	National Book Award	2005	prose	book	10000	Europe Central	t	529	198	14
2385	William Wall	William	Wall	male	\N	\N	\N	winner	University of Pittsburg Press	Drue Heinz Literature Prize	2017	prose	book	15000	The Islands	t	532	605	4
2388	William Melvin Kelley	William Melvin	Kelley	male	Harvard University	\N	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1963	prose	book	10000	A Different Drummer	t	246	4	17
2395	Wright Morris	Wright	Morris	male	\N	\N	\N	winner	National Book Foundation	National Book Award	1981	prose	book	10000	Plains Song: For Female Voices	t	343	155	14
2395	Wright Morris	Wright	Morris	male	\N	\N	\N	winner	National Book Foundation	National Book Award	1957	prose	book	10000	The Field Of Vision	t	343	580	14
2396	W. S. Merwin	W. S.	Merwin	male	Princeton University	\N	\N	winner	Columbia University	Pulitzer Prize	2009	poetry	book	15000	The Shadow Of Sirius	t	329	651	15
2396	W. S. Merwin	W. S.	Merwin	male	Princeton University	\N	\N	winner	Academy of American Poets	Lenore Marshall Poetry Prize	1994	poetry	book	25000	Travels	t	329	722	13
2396	W. S. Merwin	W. S.	Merwin	male	Princeton University	\N	\N	winner	National Book Foundation	National Book Award	2005	poetry	book	10000	Migration: New And Selected Poems	t	329	125	14
2396	W. S. Merwin	W. S.	Merwin	male	Princeton University	\N	\N	winner	Columbia University	Pulitzer Prize	1971	poetry	book	15000	The Carrier Of Ladders	t	329	554	15
2398	Yaa Gyasi	Yaa	Gyasi	female	Stanford University	graduate	University of Iowa	winner	PEN America	Hemingway Award for Debut Novel	2017	prose	book	10000	Homegoing	t	188	248	8
2400	Yiyun Li	Yiyun	Li	female	\N	graduate	University of Iowa	winner	PEN America	Hemingway Award for Debut Novel	2006	prose	book	10000	A Thousand Years Of Good Prayers	t	279	26	8
2400	Yiyun Li	Yiyun	Li	female	\N	graduate	University of Iowa	winner	PEN America	Jean Stein Book Award	2020	no genre	book	75000	Where Reasons End 	t	279	735	9
2401	Yona Harvey	Yona	Harvey	female	\N	graduate	Ohio State University	winner	Claremont Graduate University	Kate Tufts Discovery Award 	2014	poetry	book	10000	Hemming The Water	t	201	244	10
2403	Yusef Komunyakaa	Yusef	Komunyakaa	male	\N	graduate	Univeristy of California Irvine	winner	Columbia University	Pulitzer Prize	1994	poetry	book	15000	Neon Vernacular: New And Selected Poems	t	259	369	15
513	David Gates	David	Gates	male	\N	\N	\N	judge	University of Pittsburg Press	Drue Heinz Literature Prize	2017	prose	book	15000	The Islands	f	\N	4638	\N
185	Ariana Reines	Ariana	Reines	female	Barnard College Columbia University	graduate	\N	winner	Claremont Graduate University	Kingsley Tufts Poetry Award	2020	prose	book	100000	A Sand Book	t	416	21	11
289	Brigid Pasulka	Brigid	Pasulka	female	Dartmouth College	graduate	\N	winner	PEN America	Hemingway Award for Debut Novel	2010	prose	book	10000	A Long Long Time Ago And Essentially True	t	383	13	8
367	Charlotte Bacon	Charlotte	Bacon	female	Harvard University Columbia University	graduate	Columbia University	winner	PEN America	Hemingway Award for Debut Novel	1998	prose	book	10000	A Private State	t	24	19	8
772	Frederick Exley	Frederick	Exley	male	\N	\N	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1969	prose	book	10000	A Fans Notes	t	142	7	17
847	Hanif Abdurraqib	Hanif	Abdurraqib	male	\N	\N	\N	winner	Academy of American Poets	Lenore Marshall Poetry Prize	2020	poetry	book	25000	A Fortune For Your Disaster	t	2	8	13
935	Isaac Bashevis Singer	Issac Bashevis	Singer	male	\N	\N	\N	winner	National Book Foundation	National Book Award	1974	prose	book	10000	A Crown Of Feathers And Other Stories	t	458	2	14
960	James Agee	James	Agee	male	Harvard University	\N	\N	winner	Columbia University	Pulitzer Prize	1958	prose	book	15000	A Death In The Family	t	7	3	15
1017	Janna Levin	Janna	Levin	female	Barnard College	graduate	\N	winner	PEN America	Robert W. Bingham Prize for Debut Short Story Collection	2007	prose	book	25000	A Madman Dreams Of Turing Machines	t	275	16	16
1112	John Brinckerhoff Jackson	John Brinckerhoff	Jackson	male	Harvard University	\N	\N	winner	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	1995	prose	book	15000	A Sense Of Place A Sense Of Time 	t	227	22	2
1145	John Kennedy Toole	John Kennedy	Toole	male	Columbia University	graduate	\N	winner	Columbia University	Pulitzer Prize	1981	prose	book	15000	A Confederacy Of Dunces	t	511	1	15
1233	Joyce Carol Oates	Joyce Carol	Oates	female	\N	graduate	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1968	prose	book	10000	A Garden Of Earthly Delights	t	365	10	17
1629	Michael Dahlie	Michael	Dahlie	male	\N	graduate	Washington University	winner	PEN America	Hemingway Award for Debut Novel	2009	prose	book	10000	A Gentlemans Guide To Graceful Living	t	102	11	8
1958	Robert Frost	Robert	Frost	male	Harvard University	\N	\N	winner	Columbia University	Pulitzer Prize	1937	poetry	book	15000	A Further Range	t	161	9	15
1977	Robert Olen Butler	Robert Olen	Butler	male	\N	graduate	\N	winner	American Academy of Arts and Letters	Rosenthal Family Foundation Award	1993	prose	book	10000	A Good Scent From A Strange Mountain	t	69	12	17
368	Chase Twichell	Chase	Twichell	female	\N	graduate	University of Iowa	judge	Claremont Graduate University	Kate Tufts Discovery Award 	2016	poetry	book	10000	[Insert] Boy	f	\N	59	\N
577	Diane Johnson	Diane	Johnson	female	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1999	prose	book	15000	The Hours	f	\N	289	\N
966	James Dickey	James	Dickey	male	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1978	poetry	book	15000	Collected Poems	f	\N	490	\N
428	Conrad Aiken	Conrad	Aiken	male	Harvard University	\N	\N	winner	Library of Congress	Poet Laureate	1952	poetry	career	35000	\N	f	\N	754	\N
2208	Terry McMillan	Terry	McMillan	female	\N	\N	\N	judge	National Book Foundation	National Book Award	1990	prose	book	10000	Middle Passage	f	\N	1430	\N
799	George Core	George	Core	male	\N	graduate	\N	judge	Columbia University	Pulitzer Prize	1991	poetry	book	15000	Near Changes	f	\N	1436	\N
178	Anthony West	Anthony	West	male	\N	\N	\N	judge	National Book Foundation	National Book Award	1967	poetry	book	10000	Nights And Days	f	\N	1437	\N
1822	Peter Davison	Peter	Davison	male	Harvard University	\N	\N	judge	Claremont Graduate University	Kate Tufts Discovery Award 	1994	poetry	book	10000	1-800-Hot-Ribs	f	\N	1441	\N
1105	John Barkham	John	Barkham	male	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1962	prose	book	15000	The Edge Of Sadness	f	\N	1444	\N
1818	Peter Cameron	Peter	Cameron	male	\N	\N	\N	judge	National Book Foundation	National Book Award	2003	prose	book	10000	The Great Fire	f	\N	1446	\N
8	Abby Frucht	Abby	Frucht	female	\N	\N	\N	judge	PEN America	Faulkner Award for Fiction	2016	prose	book	15000	Delicious Foods	f	\N	1449	\N
196	Arthur Sze	Arthur	Sze	male	\N	\N	\N	judge	Columbia University	Pulitzer Prize	2012	poetry	book	15000	Life On Mars	f	\N	1450	\N
121	Andre Dubus	Andre	Dubus	male	\N	\N	\N	judge	National Book Foundation	National Book Award	2005	prose	book	10000	Europe Central	f	\N	1452	\N
314	Carlos Baker	Carlos	Baker	male	Dartmouth College Harvard University Princeton University	graduate	\N	judge	Columbia University	Pulitzer Prize	1956	prose	book	15000	Andersonville	f	\N	1453	\N
191	Art Winslow	Art	Winslow	male	\N	\N	\N	judge	Columbia University	Pulitzer Prize	2016	prose	book	15000	The Sympathizer	f	\N	1454	\N
845	Halle Butler	Halle	Butler	female	\N	\N	\N	judge	Center for Fiction	First Novel Prize	2020	prose	book	15000	Luster	f	\N	1455	\N
1172	John Wray	John	Wray	male	\N	\N	\N	judge	Center for Fiction	First Novel Prize	2010	prose	book	15000	Matterhorn	f	\N	1457	\N
1611	Megan Labrise	Megan	Labrise	female	\N	graduate	\N	judge	Kirkus Review	Kirkus Prize	2015	prose	book	50000	A Little Life	f	\N	1459	\N
665	Elizabeth Alexander	Elizabeth	Alexander	female	Yale University University of Pennsylvania	graduate	\N	judge	Columbia University	Pulitzer Prize	2014	poetry	book	15000	3 Sections	f	\N	1469	\N
2128	Stanley Kunitz	Stanley	Kunitz	male	Harvard University	graduate	\N	judge	Columbia University	Pulitzer Prize	1965	poetry	book	15000	77 Dream Songs	f	\N	1498	\N
1115	John Chamberlain	John	Chamberlain	male	Yale University	\N	\N	judge	Columbia University	Pulitzer Prize	1945	prose	book	15000	A Bell For Adano	f	\N	1511	\N
1330	Kwame Anthony Appiah	Kwame Anthony	Appiah	male	\N	graduate	\N	judge	American Academy of Arts and Letters	Rosenthal Family Foundation Award	2009	prose	book	10000	A Better Angel	f	\N	1526	\N
1230	Joy Boyum	Joy	Boyum	female	Barnard College	graduate	\N	judge	Columbia University	Pulitzer Prize	1981	prose	book	15000	A Confederacy Of Dunces	f	\N	1541	\N
1959	Robert Gorham Davis	Robert Gorham	Davis	male	Harvard University	\N	\N	judge	Columbia University	Pulitzer Prize	1958	prose	book	15000	A Death In The Family	f	\N	1548	\N
1105	John Barkham	John	Barkham	male	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1963	prose	book	15000	A Fable	f	\N	1551	\N
1511	Marilyn Hacker	Marilyn	Hacker	female	\N	\N	\N	judge	Academy of American Poets	Lenore Marshall Poetry Prize	1999	poetry	book	25000	Bathwater Wine	f	\N	1557	\N
1872	Raquelsalas Rivera	Raquelsalas	Rivera	nonbinary/he	University of Pennsylvania	graduate	\N	judge	Academy of American Poets	Lenore Marshall Poetry Prize	2020	poetry	book	25000	A Fortune For Your Disaster	f	\N	1566	\N
1114	John Casey	John	Casey	male	Harvard University	graduate	University of Iowa	judge	National Book Foundation	National Book Award	1994	prose	book	10000	A Frolic Of His Own	f	\N	1569	\N
1375	Leonard Bacon	Leonard	Bacon	male	Yale University	\N	\N	judge	Columbia University	Pulitzer Prize	1937	poetry	book	15000	A Further Range	f	\N	1579	\N
2158	Stewart ONan	Stewart	ONan	male	Cornell University	graduate	Cornell University	judge	PEN America	Hemingway Award for Debut Novel	2009	prose	book	10000	A Gentlemans Guide To Graceful Living	f	\N	1585	\N
1900	Richard Eder	Richard	Eder	male	Harvard University	\N	\N	judge	Columbia University	Pulitzer Prize	1993	prose	book	15000	A Good Scent From A Strange Mountain	f	\N	1591	\N
1240	Julia Glass	Julia	Glass	female	Yale University	\N	\N	judge	PEN America	Hemingway Award for Debut Novel	2010	prose	book	10000	A Long Long Time Ago And Essentially True	f	\N	1601	\N
2262	Tom Drury	Tom	Drury	male	\N	\N	\N	judge	PEN America	Robert W. Bingham Prize for Debut Short Story Collection	2013	prose	book	25000	A Naked Singularity	f	\N	1607	\N
1941	Ro Kwon	Ro	Kwon	female	Yale University	graduate	Brooklyn College	judge	PEN America	Hemingway Award for Debut Novel	2020	prose	book	10000	A Prayer For Travelers	f	\N	1614	\N
2248	Timothy Donnelly	Timothy	Donnelly	male	Columbia University	graduate	Columbia University	judge	Claremont Graduate University	Kingsley Tufts Poetry Award	2020	poetry	book	100000	A Sand Book	f	\N	1620	\N
465	Daniel Aaron	Daniel	Aaron	male	Harvard University	graduate	\N	judge	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	1995	prose	book	15000	A Sense Of Place A Sense Of Time 	f	\N	1629	\N
85	Alison Lurie	Alison	Lurie	female	Radcliffe College	\N	\N	judge	Columbia University	Pulitzer Prize	1987	prose	book	15000	A Summons To Memphis	f	\N	1635	\N
777	Gail Caldwell	Gail	Caldwell	female	\N	graduate	University of Texas Austin	judge	Columbia University	Pulitzer Prize	1992	prose	book	15000	A Thousand Acres	f	\N	1641	\N
367	Charlotte Bacon	Charlotte	Bacon	female	Harvard University Columbia University	graduate	Columbia University	judge	PEN America	Hemingway Award for Debut Novel	2006	prose	book	10000	A Thousand Years Of Good Prayers	f	\N	1647	\N
36	Alan Cheuse	Alan	Cheuse	male	\N	graduate	\N	judge	Columbia University	Pulitzer Prize	2011	prose	book	15000	A Visit From The Goon Squad	f	\N	1653	\N
1137	John Hollander	John	Hollander	male	Columbia University	graduate	\N	judge	Academy of American Poets	Lenore Marshall Poetry Prize	1985	poetry	book	25000	A Wave	f	\N	1661	\N
2344	Wilbur L. Cross	Wilbur L.	Cross	male	Yale University	graduate	\N	judge	Columbia University	Pulitzer Prize	1943	poetry	book	15000	A Witness Tree	f	\N	1667	\N
1141	John Hutch	John	Hutch	male	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1960	prose	book	15000	Advise And Consent	f	\N	1673	\N
781	Garrard Conley	Garrard	Conley	male	\N	graduate	Brooklyn College	judge	PEN America	Diamonstein-Spielvogel Award For The Art Of The Essay	2019	prose	book	15000	Against Memoir: Complaints Confessions & Criticisms	f	\N	1677	\N
1604	Maxwell Geismar	Maxwell	Geismar	male	Columbia University	graduate	\N	judge	Columbia University	Pulitzer Prize	1947	prose	book	15000	All The Kings Men	f	\N	1683	\N
2049	Samuel Crothers	Samuel	Crothers	male	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1922	prose	book	15000	Alice Adams	f	\N	1684	\N
1939	Rita Dove	Rita	Dove	female	\N	graduate	University of Iowa	judge	Columbia University	Pulitzer Prize	1997	poetry	book	15000	Alive Together: New And Selected Poems	f	\N	1689	\N
1401	Linda Gregerson	Linda	Gregerson	female	Stanford University	graduate	University of Iowa	judge	Claremont Graduate University	Kate Tufts Discovery Award 	2009	poetry	book	10000	All-American Poem	f	\N	1695	\N
602	Dorianne Laux	Dorianne	Laux	female	\N	\N	\N	judge	Academy of American Poets	Lenore Marshall Poetry Prize	2009	poetry	book	25000	All Of It Singing: New And Selected Poems	f	\N	1705	\N
36	Alan Cheuse	Alan	Cheuse	male	\N	graduate	\N	judge	Columbia University	Pulitzer Prize	2015	prose	book	15000	All The Light We Cannot See	f	\N	1716	\N
2269	Toni Cade Bambara	Toni Cade	Bambara	female	\N	graduate	\N	judge	National Book Foundation	National Book Award	1992	prose	book	10000	All The Pretty Horses	f	\N	1722	\N
777	Gail Caldwell	Gail	Caldwell	female	\N	graduate	University of Texas Austin	judge	Columbia University	Pulitzer Prize	1998	prose	book	15000	American Pastoral	f	\N	1732	\N
1445	Lucille Clifton	Lucille	Clifton	female	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1984	poetry	book	15000	American Primitive	f	\N	1738	\N
672	Elizabeth Hardwick	Elizabeth	Hardwick	female	\N	\N	\N	judge	University of Pittsburg Press	Drue Heinz Literature Prize	2002	prose	book	15000	American Standard	f	\N	1744	\N
637	Edward Hirsch	Edward	Hirsch	male	University of Pennsylvania	graduate	\N	judge	Academy of American Poets	Lenore Marshall Poetry Prize	1992	poetry	book	25000	An Atlas Of The Difficult World	f	\N	1746	\N
1477	Major Jackson	Major	Jackson	male	\N	graduate	University of Oregon	judge	Academy of American Poets	Lenore Marshall Poetry Prize	2019	poetry	book	25000	Anagnorisis	f	\N	1752	\N
2208	Terry McMillan	Terry	McMillan	female	\N	\N	\N	judge	PEN America	Bellwether Prize for Socially Engaged Fiction	2014	prose	book	25000	And West Is West	f	\N	1758	\N
1105	John Barkham	John	Barkham	male	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1972	prose	book	15000	Angel Of Repose	f	\N	1767	\N
883	Henry Seidel Canby	Henry Seidel	Canby	male	Yale University	graduate	\N	judge	Columbia University	Pulitzer Prize	1950	poetry	book	15000	Annie Allen	f	\N	1773	\N
1945	Robert Boyers	Robert	Boyers	male	\N	graduate	\N	judge	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	2012	prose	book	15000	Arguably: Selected Essays	f	\N	1779	\N
1897	Richard Burton	Richard	Burton	male	\N	graduate	\N	judge	Columbia University	Pulitzer Prize	1926	prose	book	15000	Arrowsmith	f	\N	1785	\N
898	Hillary Jordan	Hillary	Jordan	female	Columbia University	graduate	Columbia University	judge	PEN America	Bellwether Prize for Socially Engaged Fiction	2019	prose	book	25000	At The Edge Of The Haight	f	\N	1791	\N
2128	Stanley Kunitz	Stanley	Kunitz	male	Harvard University	graduate	\N	judge	Columbia University	Pulitzer Prize	1964	poetry	book	15000	At The End Of The Open Road	f	\N	1797	\N
726	Evan Connell	Evan	Connell	male	Stanford University	graduate	\N	judge	National Book Foundation	National Book Award	1973	prose	book	10000	Augustus & Chimera	f	\N	1801	\N
1423	Louis Begley	Louis	Begley	male	Harvard University	graduate	\N	judge	American Academy of Arts and Letters	Rosenthal Family Foundation Award	2013	prose	book	10000	Battleborn	f	\N	1817	\N
377	Chris Abani	Chris	Abani	male	\N	graduate	\N	judge	PEN America	Faulkner Award for Fiction	2017	prose	book	15000	Behold The Dreamers	f	\N	1837	\N
515	David Guterson	David	Guterson	male	\N	graduate	University of Washington	judge	PEN America	Faulkner Award for Fiction	2002	prose	book	15000	Bel Canto	f	\N	1841	\N
72	Alice Adams	Alice	Adams	female	Radcliffe College	\N	\N	judge	Columbia University	Pulitzer Prize	1988	prose	book	15000	Beloved	f	\N	1847	\N
660	Elena Karina Byrne	Elena Karina	Byrne	female	\N	\N	\N	judge	Claremont Graduate University	Kate Tufts Discovery Award 	2018	poetry	book	10000	Bestiary	f	\N	1853	\N
2158	Stewart ONan	Stewart	ONan	male	Cornell University	graduate	Cornell University	judge	University of Pittsburg Press	Drue Heinz Literature Prize	2005	prose	book	15000	Between Camelots	f	\N	1864	\N
2297	Verlyn Klinkenborg	Verlyn	Klinkenborg	male	Princeton University	graduate	\N	judge	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	2016	prose	book	15000	Between The World And Me	f	\N	1866	\N
1352	Laura Kasischke	Laura	Kasischke	female	\N	graduate	University of Michigan	judge	National Book Foundation	National Book Award	2012	poetry	book	10000	Bewilderment: New Poems And Translations	f	\N	1872	\N
1718	Nicholas Delbanco	Nicholas	Delbanco	male	Harvard University Columbia University	graduate	\N	judge	PEN America	Faulkner Award for Fiction	1990	prose	book	15000	Billy Bathgate	f	\N	1882	\N
1389	Lev Grossman	Lev	Grossman	male	Harvard University	\N	\N	judge	Center for Fiction	First Novel Prize	2012	prose	book	15000	Billy Lynns Long Halftime Walk	f	\N	1888	\N
470	Daniel Halpern	Daniel	Halpern	male	Columbia University	\N	\N	judge	Claremont Graduate University	Kate Tufts Discovery Award 	1999	poetry	book	10000	Bite Every Sorrow	f	\N	1898	\N
1803	Paula Fox	Paula	Fox	female	Columbia University	\N	\N	judge	American Academy of Arts and Letters	Rosenthal Family Foundation Award	2011	prose	book	10000	Bitter In The Mouth	f	\N	1908	\N
1198	Jorie Graham	Jorie	Graham	female	\N	graduate	University of Iowa	judge	Columbia University	Pulitzer Prize	1998	poetry	book	15000	Black Zodiac	f	\N	1918	\N
1444	Lucie Brock-Broido	Lucie	Brock-Broido	female	Columbia University	graduate	Columbia University	judge	Academy of American Poets	Lenore Marshall Poetry Prize	2008	poetry	book	25000	Blackbird And Wolf	f	\N	1925	\N
27	Agha Shahid Ali	Agha Shahid	Ali	male	\N	graduate	University of Arizona	judge	National Book Foundation	National Book Award	2000	poetry	book	10000	Blessing The Boats: New And Selected Poems 1988-2000	f	\N	1932	\N
1669	Molly Peacock	Molly	Peacock	female	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1999	poetry	book	15000	Blizzard Of One	f	\N	1942	\N
2292	Vance Bourjaily	Vance	Bourjaily	male	\N	\N	\N	judge	National Book Foundation	National Book Award	1978	prose	book	10000	Blood Tie	f	\N	1948	\N
1231	Joy Harjo	Joy	Harjo	female	\N	graduate	University of Iowa	judge	Academy of American Poets	Lenore Marshall Poetry Prize	2002	poetry	book	25000	Blue Dusk	f	\N	1954	\N
1508	Marie Howe	Marie	Howe	female	Columbia University	graduate	Columbia University	judge	Academy of American Poets	Lenore Marshall Poetry Prize	2015	poetry	book	25000	Book Of Hours	f	\N	1960	\N
1359	Laurie Colwin	Laurie	Colwin	female	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1989	prose	book	15000	Breathing Lessons	f	\N	1966	\N
667	Elizabeth Berg	Elizabeth	Berg	female	\N	\N	\N	judge	PEN America	Hemingway Award for Debut Novel	2007	prose	book	10000	Brief Encounters With Che Guevara	f	\N	1972	\N
2344	Wilbur L. Cross	Wilbur L.	Cross	male	Yale University	graduate	\N	judge	Columbia University	Pulitzer Prize	1935	poetry	book	15000	Bright Ambush	f	\N	1978	\N
1626	Michael Chabon	Michael	Chabon	male	\N	graduate	Univeristy of California Irvine	judge	University of Pittsburg Press	Drue Heinz Literature Prize	2004	prose	book	15000	Bring Your Legs With You	f	\N	1984	\N
1933	Rigoberto GonzÃ¡lez	Rigoberto	GonzÃ¡lez	male	\N	graduate	University of Arizona	judge	Academy of American Poets	Lenore Marshall Poetry Prize	2017	poetry	book	25000	Brooklyn Antediluvian	f	\N	1986	\N
780	Galway Kinnell	Galway	Kinnell	male	Princeton University	graduate	\N	judge	Academy of American Poets	Lenore Marshall Poetry Prize	1979	poetry	book	25000	Brothers I Loved You All	f	\N	1992	\N
222	Ben Belitt	Ben	Belitt	male	\N	graduate	\N	judge	National Book Foundation	National Book Award	1966	poetry	book	10000	Buckdancers Choice: Poems	f	\N	1998	\N
1139	John Holmes	John	Holmes	male	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1983	prose	book	15000	The Color Purple	f	\N	2001	\N
1812	Percival Everett	Percival	Everett	male	Brown University	graduate	Brown University	judge	PEN America	Faulkner Award for Fiction	2019	prose	book	15000	Call Me Zebra	f	\N	2007	\N
1950	Robert Coover	Robert	Coover	male	University of Chicago	graduate	\N	judge	University of Pittsburg Press	Drue Heinz Literature Prize	1989	prose	book	15000	Cartographies	f	\N	2013	\N
2133	Stephanie Burt	Stephanie	Burt	female	Harvard University Yale University	graduate	\N	judge	Claremont Graduate University	Kingsley Tufts Poetry Award	2016	poetry	book	100000	Catalog Of Unabashed Gratitude	f	\N	2015	\N
737	Fernanda Eberstadt	Fernanda	Eberstadt	female	\N	\N	\N	judge	National Book Foundation	National Book Award	1998	prose	book	10000	Charming Billy	f	\N	2025	\N
721	Eugene Gloria	Eugene	Gloria	male	\N	graduate	University of Oregon	judge	Claremont Graduate University	Kate Tufts Discovery Award 	2005	poetry	book	10000	Chattahoochee	f	\N	2035	\N
812	Geraldine Brooks	Geraldine	Brooks	female	Columbia University	graduate	\N	judge	PEN America	Hemingway Award for Debut Novel	2018	prose	book	10000	Chemistry	f	\N	2045	\N
2403	Yusef Komunyakaa	Yusef	Komunyakaa	male	\N	graduate	Univeristy of California Irvine	judge	Academy of American Poets	Lenore Marshall Poetry Prize	1996	poetry	book	25000	Chickamauga	f	\N	2051	\N
501	David Barber	David	Barber	male	Stanford University	graduate	\N	judge	Claremont Graduate University	Kingsley Tufts Poetry Award	2010	poetry	book	100000	Chronic	f	\N	2057	\N
1375	Leonard Bacon	Leonard	Bacon	male	Yale University	\N	\N	judge	Columbia University	Pulitzer Prize	1938	poetry	book	15000	Cold Morning Sky	f	\N	2067	\N
318	Carol De Chillis Hill	Carol	De Chillis Hill	female	\N	\N	\N	judge	National Book Foundation	National Book Award	1997	prose	book	10000	Cold Mountain	f	\N	2073	\N
1378	Leonie Adams	Leonie	Adams	female	Barnard College	\N	\N	judge	National Book Foundation	National Book Award	1953	poetry	book	10000	Collected Poems 1917-1952	f	\N	2141	\N
1137	John Hollander	John	Hollander	male	Columbia University	graduate	\N	judge	Academy of American Poets	Lenore Marshall Poetry Prize	1978	poetry	book	25000	Collected Poems 1919-1976	f	\N	2155	\N
1793	Paul Muldoon	Paul	Muldoon	male	\N	\N	\N	judge	Claremont Graduate University	Kingsley Tufts Poetry Award	2009	poetry	book	100000	Modern Life	f	\N	2160	\N
842	Gwendolyn Brooks	Gwendolyn	Brooks	female	\N	\N	\N	judge	National Book Foundation	National Book Award	1977	poetry	book	10000	Collected Poems 1930-1976: Including 43 New Poems	f	\N	2163	\N
67	Alfred Corn	Alfred	Corn	male	Columbia University	graduate	\N	judge	Academy of American Poets	Lenore Marshall Poetry Prize	1984	poetry	book	25000	Collected Poems 1930-83	f	\N	2167	\N
857	Harold Bloom	Harold	Bloom	male	Cornell University Yale University	graduate	\N	judge	National Book Foundation	National Book Award	1973	poetry	book	10000	Collected Poems 1951-1971	f	\N	2173	\N
1105	John Barkham	John	Barkham	male	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1966	prose	book	15000	Collected Stories	f	\N	2183	\N
2344	Wilbur L. Cross	Wilbur L.	Cross	male	Yale University	graduate	\N	judge	Columbia University	Pulitzer Prize	1934	poetry	book	15000	Collected Verse	f	\N	2193	\N
70	Alfred Kreynborg	Alfred	Kreynborg	male	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1951	poetry	book	15000	Complete Poems	f	\N	2199	\N
2344	Wilbur L. Cross	Wilbur L.	Cross	male	Yale University	graduate	\N	judge	Columbia University	Pulitzer Prize	1933	poetry	book	15000	Conquistador	f	\N	2203	\N
1897	Richard Burton	Richard	Burton	male	\N	graduate	\N	judge	Columbia University	Pulitzer Prize	1919	poetry	book	15000	Corn Huskers & Old Road to Paradise	f	\N	2209	\N
794	Geoff Dyer	Geoff	Dyer	male	\N	\N	\N	judge	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	2014	prose	book	15000	Critical Mass: Four Decades of Essays Reviews Hand Grenades and Hurrahs	f	\N	2215	\N
1506	Marie Arana	Marie	Arana	female	\N	graduate	\N	judge	PEN America	Fusion Emerging Writers Prize	2016	prose	book	10000	Crux	f	\N	2224	\N
1877	Raymond Carver	Raymond	Carver	male	Stanford University	graduate	University of Iowa	judge	University of Pittsburg Press	Drue Heinz Literature Prize	1982	prose	book	15000	Dancing For Men	f	\N	2235	\N
344	Charles Baxter	Charles	Baxter	male	\N	graduate	\N	judge	University of Pittsburg Press	Drue Heinz Literature Prize	1995	prose	book	15000	Dangerous Men	f	\N	2237	\N
1126	John Freeman	John	Freeman	male	\N	\N	\N	judge	PEN America	Fusion Emerging Writers Prize	2015	prose	book	10000	Dead Boys	f	\N	2239	\N
1401	Linda Gregerson	Linda	Gregerson	female	Stanford University	graduate	University of Iowa	judge	Columbia University	Pulitzer Prize	2005	poetry	book	15000	Delights And Shadows	f	\N	2250	\N
470	Daniel Halpern	Daniel	Halpern	male	Columbia University	\N	\N	judge	Claremont Graduate University	Kate Tufts Discovery Award 	1996	poetry	book	10000	Delirium	f	\N	2256	\N
76	Alice McDermott	Alice	McDermott	female	\N	graduate	\N	judge	University of Pittsburg Press	Drue Heinz Literature Prize	1994	prose	book	15000	Departures	f	\N	2266	\N
303	C. Michael Curtis	C. Michael	Curtis	male	Cornell University	\N	\N	judge	University of Pittsburg Press	Drue Heinz Literature Prize	2001	prose	book	15000	Destination Known	f	\N	2268	\N
173	Anthony Hecht	Anthony	Hecht	male	Columbia University	graduate	\N	judge	Columbia University	Pulitzer Prize	2001	poetry	book	15000	Different Hours	f	\N	2270	\N
262	Bonnie Costello	Bonnie	Costello	female	Cornell University	graduate	\N	judge	Columbia University	Pulitzer Prize	2015	poetry	book	15000	Digest	f	\N	2276	\N
842	Gwendolyn Brooks	Gwendolyn	Brooks	female	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1974	poetry	book	15000	The Dolphin	f	\N	2279	\N
1122	John Edgar Wideman	John Edgar	Wideman	male	University of Pennsylvania	graduate	University of Iowa	judge	University of Pittsburg Press	Drue Heinz Literature Prize	1992	prose	book	15000	Director Of The World And Other Stories	f	\N	2283	\N
173	Anthony Hecht	Anthony	Hecht	male	Columbia University	graduate	\N	judge	Columbia University	Pulitzer Prize	1977	poetry	book	15000	Divine Comedies	f	\N	2285	\N
521	David Kalstone	David	Kalstone	male	\N	\N	\N	judge	National Book Foundation	National Book Award	1974	poetry	book	10000	Diving Into The Wreck: Poems 1971-1972 & The Fall Of America: Poems Of These States 1965-1971	f	\N	2291	\N
1933	Rigoberto GonzÃ¡lez	Rigoberto	GonzÃ¡lez	male	\N	graduate	University of Arizona	judge	National Book Foundation	National Book Award	2020	poetry	book	10000	DMZ Colony	f	\N	2304	\N
2126	Stanley Elkin	Stanley	Elkin	male	\N	graduate	\N	judge	National Book Foundation	National Book Award	1975	prose	book	10000	Dog Soldiers & The Hair Of Harold Roux	f	\N	2314	\N
1913	Richard Russo	Richard	Russo	male	\N	graduate	University of Arizona	judge	University of Pittsburg Press	Drue Heinz Literature Prize	2016	prose	book	15000	Dog Years	f	\N	2320	\N
1459	Lynn Emanuel	Lynn	Emanuel	female	\N	graduate	University of Iowa	judge	National Book Foundation	National Book Award	2004	poetry	book	10000	Door In The Mountain: New And Collected Poems 1965-2003	f	\N	2322	\N
1115	John Chamberlain	John	Chamberlain	male	Yale University	\N	\N	judge	Columbia University	Pulitzer Prize	1943	prose	book	15000	Dragons Teeth	f	\N	2332	\N
1659	Min Jin Lee	Min Jin	Lee	female	Yale University	graduate	Georgetown University	judge	University of Pittsburg Press	Drue Heinz Literature Prize	2019	prose	book	15000	Driving In Cars With Homeless Men	f	\N	2339	\N
36	Alan Cheuse	Alan	Cheuse	male	\N	graduate	\N	judge	PEN America	Faulkner Award for Fiction	1989	prose	book	15000	Dusk	f	\N	2341	\N
1897	Richard Burton	Richard	Burton	male	\N	graduate	\N	judge	Columbia University	Pulitzer Prize	1927	prose	book	15000	Early Autumn	f	\N	2347	\N
1110	John Blades	John	Blades	male	\N	\N	\N	judge	National Book Foundation	National Book Award	1985	prose	book	10000	Easy In The Islands & White Noise	f	\N	2353	\N
85	Alison Lurie	Alison	Lurie	female	Radcliffe College	\N	\N	judge	National Book Foundation	National Book Award	1979	prose	book	10000	Going After Cacciato	f	\N	2361	\N
765	Fred Chappell	Fred	Chappell	male	\N	\N	\N	judge	National Book Foundation	National Book Award	1997	poetry	book	10000	Effort At Speech: New And Selected Poems	f	\N	2362	\N
1227	Joshua Ferris	Joshua	Ferris	male	\N	graduate	Univeristy of California Irvine	judge	PEN America	Hemingway Award for Debut Novel	2016	prose	book	10000	Eileen	f	\N	2370	\N
314	Carlos Baker	Carlos	Baker	male	Dartmouth College Harvard University Princeton University	graduate	\N	judge	Columbia University	Pulitzer Prize	1978	prose	book	15000	Elbow Room	f	\N	2376	\N
378	Chris Adrian	Chris	Adrian	male	Harvard University	graduate	University of Iowa	judge	PEN America	Hemingway Award for Debut Novel	2015	prose	book	10000	Elegy On Kinderklavier	f	\N	2382	\N
522	David Kennedy	David	Kennedy	male	Stanford University Yale University	graduate	\N	judge	Columbia University	Pulitzer Prize	2002	prose	book	15000	Empire Falls	f	\N	2388	\N
501	David Barber	David	Barber	male	Stanford University	graduate	\N	judge	Claremont Graduate University	Kingsley Tufts Poetry Award	2015	poetry	book	100000	EnchantÃ¨e	f	\N	2396	\N
1945	Robert Boyers	Robert	Boyers	male	\N	graduate	\N	judge	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	2011	prose	book	15000	Essays From The Nick Of Time: Reflections And Refutations	f	\N	2408	\N
1266	Kate Christensen	Kate	Christensen	female	\N	graduate	University of Iowa	judge	Kirkus Review	Kirkus Prize	2014	prose	book	50000	Euphoria	f	\N	2414	\N
97	Allison Joseph	Allison	Joseph	female	\N	graduate	Indiana University	judge	Claremont Graduate University	Kate Tufts Discovery Award 	2008	poetry	book	10000	Even The Hollow My Body Made Is Gone	f	\N	2429	\N
1121	John Dufresne	John	Dufresne	male	\N	graduate	University of Arkansas	judge	PEN America	Faulkner Award for Fiction	2007	prose	book	15000	Everyman	f	\N	2439	\N
2326	Walter Kirn	Walter	Kirn	male	Princeton University	\N	\N	judge	PEN America	Faulkner Award for Fiction	2013	prose	book	15000	Everything Begins & Ends At The Kentucky Club	f	\N	2445	\N
803	George Garrett	George	Garrett	male	Princeton University	graduate	\N	judge	University of Pittsburg Press	Drue Heinz Literature Prize	1997	prose	book	15000	Fado And Other Stories	f	\N	2451	\N
414	Claudia Emerson	Claudia	Emerson	female	\N	graduate	University of North Carolina	judge	Columbia University	Pulitzer Prize	2008	poetry	book	15000	Failure & Time And Materials: Poems 1997-2005	f	\N	2453	\N
649	Eileen Myles	Eileen	Myles	female	\N	\N	\N	judge	National Book Foundation	National Book Award	2014	poetry	book	10000	Faithful And Virtuous Night	f	\N	2459	\N
470	Daniel Halpern	Daniel	Halpern	male	Columbia University	\N	\N	judge	Claremont Graduate University	Kingsley Tufts Poetry Award	1998	poetry	book	100000	Falling Water	f	\N	2469	\N
2187	Sven Birkerts	Sven	Birkerts	male	\N	\N	\N	judge	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	1997	prose	book	15000	Fame And Folly: Essays	f	\N	2479	\N
2344	Wilbur L. Cross	Wilbur L.	Cross	male	Yale University	graduate	\N	judge	Columbia University	Pulitzer Prize	1927	poetry	book	15000	Fiddlers Farewell	f	\N	2485	\N
771	Frederick Crews	Frederick	Crews	male	Yale University Princeton University	graduate	\N	judge	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	1998	prose	book	15000	Finding The Trapdoor: : Essays Portraits Travels	f	\N	2491	\N
1561	Mary Jo Bang	Mary Jo	Bang	female	Columbia University	graduate	Columbia University	judge	National Book Foundation	National Book Award	2008	poetry	book	10000	Fire To Fire: New And Selected Poems	f	\N	2497	\N
2323	Walter Clemons	Walter	Clemons	male	Princeton University	graduate	\N	judge	Columbia University	Pulitzer Prize	1985	prose	book	15000	Foreign Affairs	f	\N	2507	\N
660	Elena Karina Byrne	Elena Karina	Byrne	female	\N	\N	\N	judge	Claremont Graduate University	Kingsley Tufts Poetry Award	2017	poetry	book	100000	Forest Primeval	f	\N	2512	\N
466	Daniel Alarcon	Daniel	Alarcon	male	Columbia University	graduate	University of Iowa	judge	National Book Foundation	National Book Award	2015	prose	book	10000	Fortune Smiles	f	\N	2522	\N
501	David Barber	David	Barber	male	Stanford University	graduate	\N	judge	Claremont Graduate University	Kate Tufts Discovery Award 	2013	poetry	book	10000	Fowling Piece	f	\N	2532	\N
1047	Jennifer Clement	Jennifer	Clement	female	Princeton University	graduate	\N	judge	PEN America	Jean Stein Book Award	2019	no genre	book	75000	Friday Black 	f	\N	2542	\N
1959	Robert Gorham Davis	Robert Gorham	Davis	male	Harvard University	\N	\N	judge	National Book Foundation	National Book Award	1952	prose	book	10000	From Here To Eternity	f	\N	2551	\N
2137	Stephen Berg	Stephen	Berg	male	\N	\N	\N	judge	National Book Foundation	National Book Award	1993	poetry	book	10000	Garbage	f	\N	2561	\N
2248	Timothy Donnelly	Timothy	Donnelly	male	Columbia University	graduate	Columbia University	judge	Claremont Graduate University	Kate Tufts Discovery Award 	2019	poetry	book	10000	Ghost Of	f	\N	2569	\N
1501	Maria Arana	Maria	Arana	female	\N	graduate	\N	judge	Columbia University	Pulitzer Prize	2005	prose	book	15000	Gilead	f	\N	2577	\N
2188	Sydney Lea	Sydney	Lea	male	Yale University	\N	\N	judge	Academy of American Poets	Lenore Marshall Poetry Prize	1990	poetry	book	25000	God Hunger	f	\N	2585	\N
346	Charles Bock	Charles	Bock	male	\N	graduate	Bennington College	judge	PEN America	Robert W. Bingham Prize for Debut Short Story Collection	2014	prose	book	25000	Godforsaken Idaho	f	\N	2591	\N
1037	Jefferson Fletcher	Jefferson	Fletcher	male	Harvard University	graduate	\N	judge	Columbia University	Pulitzer Prize	1937	prose	book	15000	Gone With The Wind	f	\N	2604	\N
2016	Rosellen Brown	Rosellen	Brown	female	Barnard College	\N	\N	judge	PEN America	Bellwether Prize for Socially Engaged Fiction	2012	prose	book	25000	Good Kings Bad Kings	f	\N	2610	\N
2248	Timothy Donnelly	Timothy	Donnelly	male	Columbia University	graduate	Columbia University	judge	Claremont Graduate University	Kingsley Tufts Poetry Award	2019	poetry	book	100000	Good Stock Strange Blood	f	\N	2616	\N
1293	Kay Boyle	Kay	Boyle	female	\N	\N	\N	judge	National Book Foundation	National Book Award	1960	prose	book	10000	Goodbye Columbus	f	\N	2624	\N
908	Howard Norman	Howard	Norman	male	\N	graduate	\N	judge	PEN America	Hemingway Award for Debut Novel	2005	prose	book	10000	Graceland	f	\N	2634	\N
500	David Baker	David	Baker	male	\N	graduate	\N	judge	Academy of American Poets	Lenore Marshall Poetry Prize	2007	poetry	book	25000	Grave Of Light: New And Selected Poems 1970-2005	f	\N	2640	\N
589	Donald Barthelme	Donald	Barthelme	male	\N	\N	\N	judge	National Book Foundation	National Book Award	1974	prose	book	10000	Gravitys Rainbow & A Crown Of Feathers And Other Stories	f	\N	2646	\N
1961	Robert Grant	Robert	Grant	male	Harvard University	graduate	\N	judge	Columbia University	Pulitzer Prize	1918	prose	book	15000	His Family 	f	\N	2661	\N
499	David Appel	David	Appel	male	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1949	prose	book	15000	Guard Of Honor	f	\N	2667	\N
1723	Nick Flynn	Nick	Flynn	male	\N	graduate	New York University	judge	National Book Foundation	National Book Award	2017	poetry	book	10000	Half-Light: Collected Poems 1965-2016	f	\N	2673	\N
500	David Baker	David	Baker	male	\N	graduate	\N	judge	Columbia University	Pulitzer Prize	2018	poetry	book	15000	Half-Light: Collected Poems 1965-2016.	f	\N	2683	\N
1901	Richard Ford	Richard	Ford	male	\N	graduate	Univeristy of California Irvine	judge	University of Pittsburg Press	Drue Heinz Literature Prize	1991	prose	book	15000	Have You Seen Me?	f	\N	2689	\N
665	Elizabeth Alexander	Elizabeth	Alexander	female	Yale University University of Pennsylvania	graduate	\N	judge	National Book Foundation	National Book Award	2011	poetry	book	10000	Head Off & Split: Poems	f	\N	2691	\N
70	Alfred Kreynborg	Alfred	Kreynborg	male	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1960	poetry	book	15000	Hearts Needle	f	\N	2701	\N
501	David Barber	David	Barber	male	Stanford University	graduate	\N	judge	Claremont Graduate University	Kate Tufts Discovery Award 	2014	poetry	book	10000	Hemming The Water	f	\N	2705	\N
1903	Richard Gilman	Richard	Gilman	male	\N	\N	\N	judge	National Book Foundation	National Book Award	1965	prose	book	10000	Herzog	f	\N	2715	\N
2354	William Alfred	William	Alfred	male	Harvard University	graduate	\N	judge	National Book Foundation	National Book Award	1969	poetry	book	10000	His Toy His Dream His Rest	f	\N	2727	\N
122	Andrea Barrett	Andrea	Barrett	female	\N	\N	\N	judge	PEN America	Hemingway Award for Debut Novel	2017	prose	book	10000	Homegoing	f	\N	2735	\N
1037	Jefferson Fletcher	Jefferson	Fletcher	male	Harvard University	graduate	\N	judge	Columbia University	Pulitzer Prize	1936	prose	book	15000	Honey In The Horn	f	\N	2741	\N
501	David Barber	David	Barber	male	Stanford University	graduate	\N	judge	Claremont Graduate University	Kingsley Tufts Poetry Award	2011	poetry	book	100000	Horses Where Answers Should Have Been	f	\N	2747	\N
48	Albert Duhamel	Albert	Duhamel	male	\N	graduate	\N	judge	Columbia University	Pulitzer Prize	1969	prose	book	15000	House Made Of Dawn	f	\N	2757	\N
2363	William Gass	William	Gass	male	Cornell University	graduate	\N	judge	PEN America	Faulkner Award for Fiction	1981	prose	book	15000	How German Is It?	f	\N	2763	\N
2323	Walter Clemons	Walter	Clemons	male	Princeton University	graduate	\N	judge	Columbia University	Pulitzer Prize	1976	prose	book	15000	Humboldts Gift	f	\N	2769	\N
2248	Timothy Donnelly	Timothy	Donnelly	male	Columbia University	graduate	Columbia University	judge	Claremont Graduate University	Kate Tufts Discovery Award 	2020	poetry	book	10000	I Cant Talk About The Trees Without The Blood	f	\N	2775	\N
2315	W. H. Auden	W. H.	Auden	male	\N	\N	\N	judge	National Book Foundation	National Book Award	1967	prose	book	10000	The Fixer	f	\N	2776	\N
122	Andrea Barrett	Andrea	Barrett	female	\N	\N	\N	judge	PEN America	Faulkner Award for Fiction	2018	prose	book	15000	Improvement	f	\N	2786	\N
272	Breena Clarke	Breena	Clarke	female	Columbia University	graduate	Columbia University	judge	National Book Foundation	National Book Award	2000	prose	book	10000	In America	f	\N	2792	\N
1839	Philip Levine	Philip	Levine	male	Stanford University	graduate	University of Iowa	judge	American Academy of Arts and Letters	Rosenthal Family Foundation Award	2010	prose	book	10000	In Other Rooms Other Wonders	f	\N	2802	\N
879	Helon Habila	Helon	Habila	male	\N	\N	\N	judge	PEN America	Robert W. Bingham Prize for Debut Short Story Collection	2016	prose	book	25000	In The Country: Stories	f	\N	2810	\N
753	Frank Conroy	Frank	Conroy	male	\N	\N	\N	judge	University of Pittsburg Press	Drue Heinz Literature Prize	2000	prose	book	15000	In The Gathering Woods	f	\N	2819	\N
1686	Nadine Gordimer	Nadine	Gordimer	female	\N	\N	\N	judge	University of Pittsburg Press	Drue Heinz Literature Prize	1987	prose	book	15000	In The Music Library	f	\N	2821	\N
665	Elizabeth Alexander	Elizabeth	Alexander	female	Yale University University of Pennsylvania	graduate	\N	judge	National Book Foundation	National Book Award	2002	poetry	book	10000	In The Next Galaxy	f	\N	2823	\N
69	Alfred Kazin	Alfred	Kazin	male	\N	\N	\N	judge	National Book Foundation	National Book Award	1953	prose	book	10000	Invisible Man	f	\N	2833	\N
2255	Tobias Wolff	Tobias	Wolff	male	Stanford University	graduate	\N	judge	University of Pittsburg Press	Drue Heinz Literature Prize	1993	prose	book	15000	In The Walled City	f	\N	2834	\N
1037	Jefferson Fletcher	Jefferson	Fletcher	male	Harvard University	graduate	\N	judge	Columbia University	Pulitzer Prize	1942	prose	book	15000	In This Our Life	f	\N	2836	\N
1467	Maaza Mengiste	Maaza	Mengiste	female	\N	graduate	New York University	judge	Center for Fiction	First Novel Prize	2019	prose	book	15000	In West Mills	f	\N	2842	\N
1729	Nikky Finney	Nikky	Finney	female	\N	\N	\N	judge	National Book Foundation	National Book Award	2013	poetry	book	10000	Incarnadine	f	\N	2852	\N
660	Elena Karina Byrne	Elena Karina	Byrne	female	\N	\N	\N	judge	Claremont Graduate University	Kingsley Tufts Poetry Award	2018	poetry	book	100000	Incendiary Art: Poems	f	\N	2862	\N
1561	Mary Jo Bang	Mary Jo	Bang	female	Columbia University	graduate	Columbia University	judge	National Book Foundation	National Book Award	2018	poetry	book	10000	Indecency	f	\N	2872	\N
777	Gail Caldwell	Gail	Caldwell	female	\N	graduate	University of Texas Austin	judge	Columbia University	Pulitzer Prize	1996	prose	book	15000	Independence Day	f	\N	2882	\N
182	Aravind Adiga	Aravind	Adiga	male	Columbia University	\N	\N	judge	PEN America	Robert W. Bingham Prize for Debut Short Story Collection	2017	prose	book	25000	Insurrections	f	\N	2894	\N
2022	Roxane Gay	Roxane	Gay	female	\N	graduate	\N	judge	National Book Foundation	National Book Award	2020	prose	book	10000	Interior China Town	f	\N	2904	\N
124	Andrei Codrescu	Andrei	Codrescu	male	\N	\N	\N	judge	Columbia University	Pulitzer Prize	2000	prose	book	15000	Interpreter Of Maladies	f	\N	2914	\N
208	B. H. Fairchild	B. H.	Fairchild	male	\N	graduate	\N	judge	Claremont Graduate University	Kate Tufts Discovery Award 	2001	poetry	book	10000	Invisible Tender	f	\N	2931	\N
1594	Maurice Dolbier	Maurice	Dolbier	male	\N	\N	\N	judge	National Book Foundation	National Book Award	1976	prose	book	10000	J R	f	\N	2946	\N
2344	Wilbur L. Cross	Wilbur L.	Cross	male	Yale University	graduate	\N	judge	Columbia University	Pulitzer Prize	1929	poetry	book	15000	John Browns Body	f	\N	2953	\N
1115	John Chamberlain	John	Chamberlain	male	Yale University	\N	\N	judge	Columbia University	Pulitzer Prize	1944	prose	book	15000	Journey In The Dark	f	\N	2959	\N
438	Cristina GarcÃ­a	Cristina	GarcÃ­a	female	Barnard College	graduate	\N	judge	Center for Fiction	First Novel Prize	2011	prose	book	15000	Lamb	f	\N	2965	\N
1037	Jefferson Fletcher	Jefferson	Fletcher	male	Harvard University	graduate	\N	judge	Columbia University	Pulitzer Prize	1934	prose	book	15000	Lamb In His Bosom	f	\N	2975	\N
1481	Malika Booker	Malika	Booker	female	\N	\N	\N	judge	Center for Fiction	First Novel Prize	2014	prose	book	15000	Land Of Love And Drowning	f	\N	2981	\N
1632	Michael Harper	Michael	Harper	male	\N	graduate	University of Iowa	judge	Columbia University	Pulitzer Prize	2006	poetry	book	15000	Late Wife	f	\N	2994	\N
1037	Jefferson Fletcher	Jefferson	Fletcher	male	Harvard University	graduate	\N	judge	Columbia University	Pulitzer Prize	1930	prose	book	15000	Laughing Boy	f	\N	3000	\N
1369	Leahhager Cohen	Leahhager	Cohen	female	Columbia University	graduate	\N	judge	Columbia University	Pulitzer Prize	2018	prose	book	15000	Less	f	\N	3006	\N
36	Alan Cheuse	Alan	Cheuse	male	\N	graduate	\N	judge	National Book Foundation	National Book Award	2009	prose	book	10000	Let The Great World Spin	f	\N	3012	\N
1836	Philip Booth	Philip	Booth	male	Dartmouth College Columbia University	graduate	\N	judge	National Book Foundation	National Book Award	1960	poetry	book	10000	Life Studies	f	\N	3027	\N
1836	Philip Booth	Philip	Booth	male	Dartmouth College Columbia University	graduate	\N	judge	National Book Foundation	National Book Award	1982	poetry	book	10000	Life Supports: New And Collected Poems	f	\N	3037	\N
1861	Rae Armantrout	Rae	Armantrout	female	\N	graduate	San Francisco State University	judge	National Book Foundation	National Book Award	2010	poetry	book	10000	Lighthead	f	\N	3051	\N
2031	Russell Banks	Russell	Banks	male	\N	\N	\N	judge	University of Pittsburg Press	Drue Heinz Literature Prize	1990	prose	book	15000	Limbo River	f	\N	3061	\N
1899	Richard Eberhart	Richard	Eberhart	male	Dartmouth College	graduate	\N	judge	Columbia University	Pulitzer Prize	1967	poetry	book	15000	Live Or Die	f	\N	3063	\N
1652	Michiko Kakutani	Michiko	Kakutani	female	Yale University	\N	\N	judge	Columbia University	Pulitzer Prize	1986	prose	book	15000	Lonesome Dove	f	\N	3069	\N
124	Andrei Codrescu	Andrei	Codrescu	male	\N	\N	\N	judge	National Book Foundation	National Book Award	2010	prose	book	10000	Lord Of Misrule	f	\N	3075	\N
883	Henry Seidel Canby	Henry Seidel	Canby	male	Yale University	graduate	\N	judge	Columbia University	Pulitzer Prize	1947	poetry	book	15000	Lord Wearys Castle	f	\N	3085	\N
1437	Louise Gluck	Louise	Gluck	female	\N	\N	\N	judge	American Academy of Arts and Letters	Rosenthal Family Foundation Award	2020	prose	book	10000	Lost Children Archive	f	\N	3091	\N
97	Allison Joseph	Allison	Joseph	female	\N	graduate	Indiana University	judge	Claremont Graduate University	Kingsley Tufts Poetry Award	2006	poetry	book	100000	Luck Is Luck	f	\N	3097	\N
604	Doris Grumbach	Doris	Grumbach	female	Cornell University	graduate	\N	judge	PEN America	Faulkner Award for Fiction	1992	prose	book	15000	Mao Ii	f	\N	3118	\N
1506	Marie Arana	Marie	Arana	female	\N	graduate	\N	judge	Columbia University	Pulitzer Prize	2006	prose	book	15000	March	f	\N	3124	\N
1853	R. H. W. Dillard	R. H. W.	Dillard	male	\N	graduate	\N	judge	Columbia University	Pulitzer Prize	1997	prose	book	15000	Martin Dressler: The Tale Of An American Dreamer	f	\N	3132	\N
739	Fiona Maazel	Fiona	Maazel	female	\N	graduate	Bennington College	judge	Center for Fiction	First Novel Prize	2017	prose	book	15000	Mikhail And Margarita	f	\N	3136	\N
152	Anne Bernays	Anne	Bernays	female	Barnard College	\N	\N	judge	National Book Foundation	National Book Award	1991	prose	book	10000	Mating	f	\N	3140	\N
1401	Linda Gregerson	Linda	Gregerson	female	Stanford University	graduate	University of Iowa	judge	Claremont Graduate University	Kingsley Tufts Poetry Award	2004	poetry	book	100000	Middle Earth	f	\N	3161	\N
777	Gail Caldwell	Gail	Caldwell	female	\N	graduate	University of Texas Austin	judge	Columbia University	Pulitzer Prize	2003	prose	book	15000	Middlesex	f	\N	3179	\N
1524	Mark Bowden	Mark	Bowden	male	\N	\N	\N	judge	National Book Foundation	National Book Award	2005	poetry	book	10000	Migration: New And Selected Poems	f	\N	3187	\N
668	Elizabeth Bishop	Elizabeth	Bishop	female	\N	\N	\N	judge	National Book Foundation	National Book Award	1979	poetry	book	10000	Mirabell: Books Of Number	f	\N	3205	\N
672	Elizabeth Hardwick	Elizabeth	Hardwick	female	\N	\N	\N	judge	National Book Foundation	National Book Award	1963	prose	book	10000	Morte DUrban	f	\N	3220	\N
1489	Margaret Atwood	Margaret	Atwood	female	Radcliffe College	graduate	\N	judge	University of Pittsburg Press	Drue Heinz Literature Prize	1988	prose	book	15000	Moustaphas Eclipse	f	\N	3226	\N
1982	Robert Pinsky	Robert	Pinsky	male	Stanford University	graduate	\N	judge	Columbia University	Pulitzer Prize	2003	poetry	book	15000	Moy Sand And Gravel	f	\N	3228	\N
1116	John Cheever	John	Cheever	male	\N	\N	\N	judge	National Book Foundation	National Book Award	1971	prose	book	10000	Mr. Sammlers Planet	f	\N	3234	\N
380	Chris Bohjalian	Chris	Bohjalian	male	\N	\N	\N	judge	PEN America	Hemingway Award for Debut Novel	2004	prose	book	10000	Mrs. Kimble	f	\N	3244	\N
741	Forrest Gander	Forrest	Gander	male	\N	graduate	\N	judge	Academy of American Poets	Lenore Marshall Poetry Prize	2004	poetry	book	25000	My Mojave	f	\N	3250	\N
1862	Rafael Campo	Rafael	Campo	male	\N	graduate	\N	judge	Columbia University	Pulitzer Prize	2007	poetry	book	15000	Native Guard	f	\N	3256	\N
249	Bharati Mukherjee	Bharati	Mukherjee	female	\N	graduate	University of Iowa	judge	University of Pittsburg Press	Drue Heinz Literature Prize	1998	prose	book	15000	Necessary Fictions	f	\N	3267	\N
307	Calvin Bedient	Calvin	Bedient	male	\N	graduate	\N	judge	Columbia University	Pulitzer Prize	1994	poetry	book	15000	Neon Vernacular: New And Selected Poems	f	\N	3269	\N
1371	Lee Abbott	Lee	Abbott	male	\N	graduate	University of Arkansas	judge	PEN America	Faulkner Award for Fiction	2009	prose	book	15000	Netherland	f	\N	3285	\N
1445	Lucille Clifton	Lucille	Clifton	female	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1989	poetry	book	15000	New And Collected Poems	f	\N	3291	\N
721	Eugene Gloria	Eugene	Gloria	male	\N	graduate	University of Oregon	judge	Claremont Graduate University	Kingsley Tufts Poetry Award	2005	poetry	book	100000	New And Selected Poems	f	\N	3297	\N
1445	Lucille Clifton	Lucille	Clifton	female	\N	\N	\N	judge	National Book Foundation	National Book Award	1992	poetry	book	10000	New And Selected Poems (Vol 1 Of Two)	f	\N	3307	\N
2344	Wilbur L. Cross	Wilbur L.	Cross	male	Yale University	graduate	\N	judge	Columbia University	Pulitzer Prize	1924	poetry	book	15000	New Hampshire: A Poem With Notes And Grace Notes	f	\N	3318	\N
591	Donald Hall	Donald	Hall	male	Harvard University Stanford University	graduate	\N	judge	Academy of American Poets	Lenore Marshall Poetry Prize	1991	poetry	book	25000	New Poems 1980-88	f	\N	3324	\N
1857	Rachel Hadas	Rachel	Hadas	female	Radcliffe College Princeton University	graduate	\N	judge	Academy of American Poets	Lenore Marshall Poetry Prize	1986	poetry	book	25000	New Selected Poems	f	\N	3330	\N
1081	Joan Didion	Joan	Didion	female	\N	\N	\N	judge	University of Pittsburg Press	Drue Heinz Literature Prize	2006	prose	book	15000	Newsworld	f	\N	3336	\N
1503	Marianne Boruch	Marianne	Boruch	female	\N	graduate	University of Massachusetts Amherst	judge	Academy of American Poets	Lenore Marshall Poetry Prize	2010	poetry	book	25000	Ninety-Fifth Street	f	\N	3347	\N
2307	Vinson Cunningham	Vinson	Cunningham	male	\N	\N	\N	judge	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	2018	prose	book	15000	No Time to Spare: Thinking about what Matters	f	\N	3353	\N
314	Carlos Baker	Carlos	Baker	male	Dartmouth College Harvard University Princeton University	graduate	\N	judge	Columbia University	Pulitzer Prize	1957	prose	book	15000	No Winner	f	\N	3359	\N
1387	Leslie Marmon Silko	Leslie Marmon	Silko	female	None	None	None	winner	American Academy of Arts and Letters	Christopher Lightfoot Walker Award	2020	no genre	career	100000	None	f	\N	3397	\N
1103	John Ashbery	John	Ashbery	male	Harvard University Columbia University	graduate	\N	judge	Columbia University	Pulitzer Prize	1979	poetry	book	15000	Now And Then	f	\N	3405	\N
1037	Jefferson Fletcher	Jefferson	Fletcher	male	Harvard University	graduate	\N	judge	Columbia University	Pulitzer Prize	1935	prose	book	15000	Now In November	f	\N	3411	\N
869	Hayden Carruth	Hayden	Carruth	male	University of Chicago	graduate	\N	judge	Academy of American Poets	Lenore Marshall Poetry Prize	1975	poetry	book	25000	O/I	f	\N	3417	\N
966	James Dickey	James	Dickey	male	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1969	poetry	book	15000	Of Being Numerous	f	\N	3419	\N
2316	W. S. DiPiero	W. S.	DiPiero	male	\N	graduate	\N	judge	Academy of American Poets	Lenore Marshall Poetry Prize	2000	poetry	book	25000	Of No Country I Know: New And Selected Poems And Translations	f	\N	3425	\N
1004	Jane Hirshfield	Jane	Hirshfield	female	Princeton University	\N	\N	judge	Columbia University	Pulitzer Prize	2017	poetry	book	15000	Olio	f	\N	3432	\N
1853	R. H. W. Dillard	R. H. W.	Dillard	male	\N	graduate	\N	judge	Columbia University	Pulitzer Prize	2009	prose	book	15000	Olive Kitteridge	f	\N	3438	\N
2049	Samuel Crothers	Samuel	Crothers	male	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1923	prose	book	15000	One Of Ours	f	\N	3446	\N
1614	Mei-Mei Berssenbrugge	Mei-Mei	Berssenbrugge	female	Columbia University	graduate	Columbia University	judge	Academy of American Poets	Lenore Marshall Poetry Prize	2011	poetry	book	25000	One With Others	f	\N	3452	\N
1778	Paul Auster	Paul	Auster	male	Columbia University	graduate	\N	judge	American Academy of Arts and Letters	Rosenthal Family Foundation Award	2012	prose	book	10000	Open City	f	\N	3458	\N
744	Francine Prose	Francine	Prose	female	Radcliffe College	\N	\N	judge	PEN America	Faulkner Award for Fiction	1994	prose	book	15000	Operation Shylock	f	\N	3478	\N
568	Denis Donoghue	Denis	Donoghue	male	\N	graduate	\N	judge	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	1996	prose	book	15000	Other Minds: Critical Essays 1969-1994	f	\N	3484	\N
309	Carl Dennis	Carl	Dennis	male	\N	graduate	\N	judge	Academy of American Poets	Lenore Marshall Poetry Prize	2006	poetry	book	25000	Our Post-Soviet History Unfolds	f	\N	3490	\N
2079	Scott Turow	Scott	Turow	male	Stanford University	graduate	\N	judge	University of Pittsburg Press	Drue Heinz Literature Prize	2008	prose	book	15000	Out Loud	f	\N	3496	\N
1862	Rafael Campo	Rafael	Campo	male	\N	graduate	\N	judge	Columbia University	Pulitzer Prize	2016	poetry	book	15000	Ozone Journal	f	\N	3498	\N
1900	Richard Eder	Richard	Eder	male	Harvard University	\N	\N	judge	National Book Foundation	National Book Award	1987	prose	book	10000	Pacos Story	f	\N	3504	\N
896	Hilary Masters	Hilary	Masters	male	Brown University	\N	\N	judge	University of Pittsburg Press	Drue Heinz Literature Prize	2007	prose	book	15000	Paradise Road	f	\N	3510	\N
1093	Joe Conarroe	Joe	Conarroe	male	\N	graduate	\N	judge	National Book Foundation	National Book Award	1988	prose	book	10000	Paris Trout	f	\N	3512	\N
780	Galway Kinnell	Galway	Kinnell	male	Princeton University	graduate	\N	judge	Columbia University	Pulitzer Prize	1988	poetry	book	15000	Partial Accounts: New And Selected Poems	f	\N	3522	\N
1205	Joseph Bruchac	Joseph	Bruchac	male	Cornell University	graduate	\N	judge	National Book Foundation	National Book Award	1995	poetry	book	10000	Passing Through: The Later Poems New And Selected	f	\N	3528	\N
1812	Percival Everett	Percival	Everett	male	Brown University	graduate	Brown University	judge	PEN America	Faulkner Award for Fiction	1991	prose	book	15000	Philadelphia Fire	f	\N	3538	\N
2128	Stanley Kunitz	Stanley	Kunitz	male	Harvard University	graduate	\N	judge	Columbia University	Pulitzer Prize	1963	poetry	book	15000	Pictures From Brueghel	f	\N	3544	\N
2128	Stanley Kunitz	Stanley	Kunitz	male	Harvard University	graduate	\N	judge	Columbia University	Pulitzer Prize	1962	poetry	book	15000	Poems	f	\N	3548	\N
1378	Leonie Adams	Leonie	Adams	female	Barnard College	\N	\N	judge	National Book Foundation	National Book Award	1962	poetry	book	10000	Poems (Vol 1 of Seven)	f	\N	3551	\N
1862	Rafael Campo	Rafael	Campo	male	\N	graduate	\N	judge	National Book Foundation	National Book Award	2001	poetry	book	10000	Poems Seven: New And Complete Poetry (Vol 7 Of Seven)	f	\N	3555	\N
1116	John Cheever	John	Cheever	male	\N	\N	\N	judge	National Book Foundation	National Book Award	1964	prose	book	10000	The Centaur	f	\N	4304	\N
70	Alfred Kreynborg	Alfred	Kreynborg	male	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1956	poetry	book	15000	Poems: North & South: A Cold Spring	f	\N	3565	\N
2029	Rudolfo Anaya	Rudolfo	Anaya	male	\N	graduate	\N	judge	PEN America	Faulkner Award for Fiction	1993	prose	book	15000	Postcards	f	\N	3569	\N
97	Allison Joseph	Allison	Joseph	female	\N	graduate	Indiana University	judge	Claremont Graduate University	Kate Tufts Discovery Award 	2007	poetry	book	10000	Potscrubber Lullabies	f	\N	3575	\N
592	Donald Justice	Donald	Justice	male	Stanford University	graduate	\N	judge	Columbia University	Pulitzer Prize	2002	poetry	book	15000	Practical Gods	f	\N	3585	\N
61	Alexander Chee	Alexander	Chee	male	\N	graduate	University of Iowa	judge	PEN America	Faulkner Award for Fiction	2015	prose	book	15000	Preparation For The Next Life	f	\N	3591	\N
1261	Karl Malkoff	Karl	Malkoff	male	\N	\N	\N	judge	National Book Foundation	National Book Award	1975	poetry	book	10000	Presentation Piece	f	\N	3597	\N
2395	Wright Morris	Wright	Morris	male	\N	\N	\N	judge	University of Pittsburg Press	Drue Heinz Literature Prize	1983	prose	book	15000	Private Parties	f	\N	3603	\N
1117	John Ciardi	John	Ciardi	male	\N	graduate	\N	judge	National Book Foundation	National Book Award	1958	poetry	book	10000	Promises: Poems 1954-1956	f	\N	3605	\N
362	Charles Simic	Charles	Simic	male	\N	\N	\N	judge	Academy of American Poets	Lenore Marshall Poetry Prize	1998	poetry	book	25000	Questions For Ecclesiastes	f	\N	3620	\N
1900	Richard Eder	Richard	Eder	male	Harvard University	\N	\N	judge	Columbia University	Pulitzer Prize	1991	prose	book	15000	Rabbit At Rest	f	\N	3626	\N
1492	Margaret Manning	Margaret	Manning	female	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1982	prose	book	15000	Rabbit Is Rich	f	\N	3632	\N
1956	Robert Flint	Robert	Flint	male	\N	\N	\N	judge	National Book Foundation	National Book Award	1982	prose	book	10000	Rabbit Is Rich & So Long See You Tomorrow	f	\N	3638	\N
501	David Barber	David	Barber	male	Stanford University	graduate	\N	judge	Claremont Graduate University	Kate Tufts Discovery Award 	2012	poetry	book	10000	Radial Symmetry	f	\N	3650	\N
1822	Peter Davison	Peter	Davison	male	Harvard University	\N	\N	judge	Claremont Graduate University	Kingsley Tufts Poetry Award	1993	poetry	book	100000	Rapture	f	\N	3660	\N
470	Daniel Halpern	Daniel	Halpern	male	Columbia University	\N	\N	judge	Claremont Graduate University	Kate Tufts Discovery Award 	1998	poetry	book	10000	Reading The Water	f	\N	3670	\N
812	Geraldine Brooks	Geraldine	Brooks	female	Columbia University	graduate	\N	judge	National Book Foundation	National Book Award	2014	prose	book	10000	Redeployment	f	\N	3680	\N
208	B. H. Fairchild	B. H.	Fairchild	male	\N	graduate	\N	judge	Claremont Graduate University	Kingsley Tufts Poetry Award	2000	poetry	book	100000	Reign Of Snakes	f	\N	3690	\N
1044	Jelani Cobb	Jelani	Cobb	male	\N	graduate	\N	judge	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	2020	prose	book	15000	Resurrection Of The Wild: Meditations On Ohios Natural Landscape	f	\N	3700	\N
501	David Barber	David	Barber	male	Stanford University	graduate	\N	judge	Claremont Graduate University	Kate Tufts Discovery Award 	2011	poetry	book	10000	Romeys Order	f	\N	3706	\N
1594	Maurice Dolbier	Maurice	Dolbier	male	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1977	prose	book	15000	Roots	f	\N	3717	\N
470	Daniel Halpern	Daniel	Halpern	male	Columbia University	\N	\N	judge	Claremont Graduate University	Kingsley Tufts Poetry Award	1996	poetry	book	100000	Rough Music	f	\N	3723	\N
707	Erica Jong	Erica	Jong	female	Barnard College	\N	\N	judge	National Book Foundation	National Book Award	1995	prose	book	10000	Sabbaths Theater	f	\N	3734	\N
1058	Jerome Charyn	Jerome	Charyn	male	Columbia University	\N	\N	judge	National Book Foundation	National Book Award	2011	prose	book	10000	Salvage The Bones	f	\N	3744	\N
97	Allison Joseph	Allison	Joseph	female	\N	graduate	Indiana University	judge	Claremont Graduate University	Kingsley Tufts Poetry Award	2007	poetry	book	100000	Salvation Blues	f	\N	3754	\N
1897	Richard Burton	Richard	Burton	male	\N	graduate	\N	judge	Columbia University	Pulitzer Prize	1929	prose	book	15000	Scarlet Sister Mary	f	\N	3764	\N
1510	Marilyn Chin	Marilyn	Chin	female	Stanford University	graduate	University of Iowa	judge	National Book Foundation	National Book Award	1996	poetry	book	10000	Scrambled Eggs & Whiskey: Poems 1991-1995	f	\N	3770	\N
1767	Patricia Engel	Patricia	Engel	female	\N	graduate	Florida International University	judge	PEN America	Faulkner Award for Fiction	2020	prose	book	15000	Sea Monsters	f	\N	3780	\N
2340	Wesley Brown	Wesley	Brown	male	\N	\N	\N	judge	PEN America	Faulkner Award for Fiction	1982	prose	book	15000	Seaview	f	\N	3786	\N
962	James Applewhite	James	Applewhite	male	\N	graduate	\N	judge	Columbia University	Pulitzer Prize	1980	poetry	book	15000	Selected Poems	f	\N	3791	\N
796	Geoffrey Hartman	Geoffrey	Hartman	male	Yale University	graduate	\N	judge	National Book Foundation	National Book Award	1972	poetry	book	10000	Selected Poems & The Collected Poems Of Frank OHara	f	\N	3849	\N
70	Alfred Kreynborg	Alfred	Kreynborg	male	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1959	poetry	book	15000	Selected Poems 1928-1958	f	\N	3865	\N
105	Amy Clampitt	Amy	Clampitt	female	\N	\N	\N	judge	Academy of American Poets	Lenore Marshall Poetry Prize	1989	poetry	book	25000	Selected Poems 1938-1988	f	\N	3869	\N
1153	John Malcolm Brinnin	John Malcolm	Brinnin	male	Harvard University	graduate	\N	judge	National Book Foundation	National Book Award	1976	poetry	book	10000	Self-Portrait In A Convex Mirror	f	\N	3875	\N
2055	Sandra Cisneros	Sandra	Cisneros	female	\N	graduate	University of Iowa	judge	Kirkus Review	Kirkus Prize	2018	prose	book	50000	Severance	f	\N	3887	\N
778	Gail Godwin	Gail	Godwin	female	\N	graduate	\N	judge	National Book Foundation	National Book Award	2008	prose	book	10000	Shadow Country	f	\N	3893	\N
104	Amy Bloom	Amy	Bloom	female	\N	\N	\N	judge	National Book Foundation	National Book Award	1996	prose	book	10000	Ship Fever And Other Stories	f	\N	3903	\N
431	Cornelius Eady	Cornelius	Eady	male	\N	graduate	Warren Wilson College	judge	Academy of American Poets	Lenore Marshall Poetry Prize	2013	poetry	book	25000	Shoulda Been Jimi Savannah	f	\N	3914	\N
1199	Jos Charles	Jos	Charles	female	\N	graduate	University of Arizona	judge	National Book Foundation	National Book Award	2019	poetry	book	10000	Sight Lines	f	\N	3920	\N
61	Alexander Chee	Alexander	Chee	male	\N	graduate	University of Iowa	judge	National Book Foundation	National Book Award	2017	prose	book	10000	Sing Unburied Sing	f	\N	3930	\N
354	Charles Johnson	Charles	Johnson	male	\N	\N	\N	judge	PEN America	Faulkner Award for Fiction	1995	prose	book	15000	Snow Falling On Cedars	f	\N	3940	\N
1754	Oscar Firkins	Oscar	Firkins	male	\N	graduate	\N	judge	Columbia University	Pulitzer Prize	1925	prose	book	15000	So Big	f	\N	3946	\N
2011	Ron Hansen	Ron	Hansen	male	Stanford University	graduate	University of Iowa	judge	PEN America	Faulkner Award for Fiction	1987	prose	book	15000	Soldiers In Hiding	f	\N	3952	\N
2031	Russell Banks	Russell	Banks	male	\N	\N	\N	judge	American Academy of Arts and Letters	Rosenthal Family Foundation Award	2018	prose	book	10000	Sonora	f	\N	3958	\N
97	Allison Joseph	Allison	Joseph	female	\N	graduate	Indiana University	judge	Claremont Graduate University	Kingsley Tufts Poetry Award	2008	poetry	book	100000	Space Walk	f	\N	3968	\N
227	Benjamin Demott	Benjamin	Demott	male	Harvard University	graduate	\N	judge	National Book Foundation	National Book Award	1989	prose	book	10000	Spartina	f	\N	3978	\N
189	Arnold Dolin	Arnold	Dolin	male	\N	graduate	\N	judge	Center for Fiction	First Novel Prize	2006	prose	book	15000	Special Topics In Calamity Physics	f	\N	3988	\N
1928	Rick Moody	Rick	Moody	male	Brown University Columbia University	graduate	Columbia University	judge	University of Pittsburg Press	Drue Heinz Literature Prize	2003	prose	book	15000	Speed-Walk And Other Stories	f	\N	3995	\N
1077	Jimmy Santiago Baca	Jimmy Santiago	Baca	male	\N	\N	\N	judge	National Book Foundation	National Book Award	2006	poetry	book	10000	Splay Anthem	f	\N	3997	\N
470	Daniel Halpern	Daniel	Halpern	male	Columbia University	\N	\N	judge	Claremont Graduate University	Kingsley Tufts Poetry Award	1995	poetry	book	100000	Split Horizon	f	\N	4007	\N
470	Daniel Halpern	Daniel	Halpern	male	Columbia University	\N	\N	judge	Claremont Graduate University	Kingsley Tufts Poetry Award	1997	poetry	book	100000	Spring Comes To Chicago	f	\N	4017	\N
1595	Maurice Manning	Maurice	Manning	male	\N	graduate	University of Alabama	judge	Columbia University	Pulitzer Prize	2013	poetry	book	15000	Stags Leap	f	\N	4028	\N
2395	Wright Morris	Wright	Morris	male	\N	\N	\N	judge	National Book Foundation	National Book Award	1969	prose	book	10000	Steps	f	\N	4034	\N
1235	Judith Ortiz Cofer	Judith Ortiz	Cofer	female	\N	graduate	\N	judge	Academy of American Poets	Lenore Marshall Poetry Prize	2003	poetry	book	25000	Still Life With Waterfall	f	\N	4038	\N
2165	Susan Cheever	Susan	Cheever	female	Brown University	\N	\N	judge	PEN America	Robert W. Bingham Prize for Debut Short Story Collection	2011	prose	book	25000	Stiltsville	f	\N	4044	\N
1375	Leonard Bacon	Leonard	Bacon	male	Yale University	\N	\N	judge	Columbia University	Pulitzer Prize	1936	poetry	book	15000	Strange Holiness	f	\N	4050	\N
2380	William Rose BenÃ©t	William Rose	BenÃ©t	male	Yale University	\N	\N	judge	Columbia University	Pulitzer Prize	1941	poetry	book	15000	Sunderland Capture	f	\N	4056	\N
1115	John Chamberlain	John	Chamberlain	male	Yale University	\N	\N	judge	Columbia University	Pulitzer Prize	1948	prose	book	15000	Tales Of The Pacific	f	\N	4068	\N
501	David Barber	David	Barber	male	Stanford University	graduate	\N	judge	Claremont Graduate University	Kate Tufts Discovery Award 	2010	poetry	book	10000	Temper	f	\N	4074	\N
314	Carlos Baker	Carlos	Baker	male	Dartmouth College Harvard University Princeton University	graduate	\N	judge	National Book Foundation	National Book Award	1956	prose	book	10000	Ten North Frederick	f	\N	4084	\N
883	Henry Seidel Canby	Henry Seidel	Canby	male	Yale University	graduate	\N	judge	Columbia University	Pulitzer Prize	1949	poetry	book	15000	Terror And Decorum	f	\N	4097	\N
2049	Samuel Crothers	Samuel	Crothers	male	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1924	prose	book	15000	The Able McLaughlins	f	\N	4103	\N
509	David Dempsey	David	Dempsey	male	\N	graduate	\N	judge	National Book Foundation	National Book Award	1954	prose	book	10000	The Adventures Of Augie March	f	\N	4109	\N
883	Henry Seidel Canby	Henry Seidel	Canby	male	Yale University	graduate	\N	judge	Columbia University	Pulitzer Prize	1948	poetry	book	15000	The Age Of Anxiety	f	\N	4119	\N
846	Hamlin Garland	Hamlin	Garland	male	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1921	prose	book	15000	The Age Of Innocence	f	\N	4125	\N
777	Gail Caldwell	Gail	Caldwell	female	\N	graduate	University of Texas Austin	judge	Columbia University	Pulitzer Prize	2001	prose	book	15000	The Amazing Adventures Of Kavalier & Clay	f	\N	4131	\N
460	Dana Gioia	Dana	Gioia	male	Stanford University Harvard University	graduate	\N	judge	Academy of American Poets	Lenore Marshall Poetry Prize	1983	poetry	book	25000	The Argot Merchant Disaster	f	\N	4137	\N
470	Daniel Halpern	Daniel	Halpern	male	Columbia University	\N	\N	judge	Claremont Graduate University	Kingsley Tufts Poetry Award	1999	poetry	book	100000	The Art Of The Lathe	f	\N	4144	\N
1131	John Guare	John	Guare	male	\N	graduate	Yale University	judge	American Academy of Arts and Letters	Rosenthal Family Foundation Award	2017	prose	book	10000	The Association Of Small Bombs	f	\N	4154	\N
842	Gwendolyn Brooks	Gwendolyn	Brooks	female	\N	\N	\N	judge	National Book Foundation	National Book Award	1951	poetry	book	10000	The Auroras Of Autumn	f	\N	4164	\N
2344	Wilbur L. Cross	Wilbur L.	Cross	male	Yale University	graduate	\N	judge	Columbia University	Pulitzer Prize	1923	poetry	book	15000	The Ballad Of The Harp-Weaver: A Few Figs From Thistles: Eight Sonnets In American Poetry 1922. A Miscellany	f	\N	4174	\N
2322	Walter Abish	Walter	Abish	male	\N	\N	\N	judge	PEN America	Faulkner Award for Fiction	1983	prose	book	15000	The Barracks Thief	f	\N	4180	\N
1471	Madison Smart Bell	Madison Smart	Bell	male	Princeton University	graduate	\N	judge	PEN America	Faulkner Award for Fiction	1998	prose	book	15000	The Bear Comes Home	f	\N	4192	\N
2200	Ted Kooser	Ted	Kooser	male	\N	graduate	\N	judge	Columbia University	Pulitzer Prize	2011	poetry	book	15000	The Best Of It: New And Selected Poems	f	\N	4198	\N
470	Daniel Halpern	Daniel	Halpern	male	Columbia University	\N	\N	judge	Claremont Graduate University	Kate Tufts Discovery Award 	1997	poetry	book	10000	The Body Mutinies	f	\N	4204	\N
97	Allison Joseph	Allison	Joseph	female	\N	graduate	Indiana University	judge	Claremont Graduate University	Kate Tufts Discovery Award 	2006	poetry	book	10000	The Book Of Funnels	f	\N	4215	\N
501	David Barber	David	Barber	male	Stanford University	graduate	\N	judge	Claremont Graduate University	Kingsley Tufts Poetry Award	2013	poetry	book	100000	The Book Of Hours	f	\N	4225	\N
1401	Linda Gregerson	Linda	Gregerson	female	Stanford University	graduate	University of Iowa	judge	Claremont Graduate University	Kate Tufts Discovery Award 	2004	poetry	book	10000	The Brass Girl Brouhaha	f	\N	4235	\N
328	Carolyn Kizer	Carolyn	Kizer	female	Columbia University	graduate	\N	judge	Academy of American Poets	Lenore Marshall Poetry Prize	1982	poetry	book	25000	The Bridge Of Change: Poems 1974-1980	f	\N	4245	\N
1897	Richard Burton	Richard	Burton	male	\N	graduate	\N	judge	Columbia University	Pulitzer Prize	1928	prose	book	15000	The Bridge Of San Luis Rey	f	\N	4252	\N
522	David Kennedy	David	Kennedy	male	Stanford University Yale University	graduate	\N	judge	Columbia University	Pulitzer Prize	2008	prose	book	15000	The Brief Wondrous Life Of Oscar Wao	f	\N	4258	\N
1517	Marita Golden	Marita	Golden	female	Columbia University	graduate	\N	judge	PEN America	Faulkner Award for Fiction	2012	prose	book	15000	The Buddha In The Attic	f	\N	4272	\N
2023	Roy Couden	Roy	Couden	male	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1952	prose	book	15000	The Caine Mutiny	f	\N	4278	\N
778	Gail Godwin	Gail	Godwin	female	\N	graduate	\N	judge	PEN America	Faulkner Award for Fiction	2003	prose	book	15000	The Caprices	f	\N	4282	\N
173	Anthony Hecht	Anthony	Hecht	male	Columbia University	graduate	\N	judge	Columbia University	Pulitzer Prize	1971	poetry	book	15000	The Carrier Of Ladders	f	\N	4288	\N
377	Chris Abani	Chris	Abani	male	\N	graduate	\N	judge	Center for Fiction	First Novel Prize	2016	prose	book	15000	The Castle Cross The Magnet Carter	f	\N	4294	\N
501	David Barber	David	Barber	male	Stanford University	graduate	\N	judge	Claremont Graduate University	Kingsley Tufts Poetry Award	2012	poetry	book	100000	The Cloud Corporation	f	\N	4312	\N
799	George Core	George	Core	male	\N	graduate	\N	judge	Columbia University	Pulitzer Prize	1982	poetry	book	15000	The Collected Poems	f	\N	4322	\N
470	Daniel Halpern	Daniel	Halpern	male	Columbia University	\N	\N	judge	National Book Foundation	National Book Award	1978	poetry	book	10000	The Collected Poems Of Howard Nemerov	f	\N	4328	\N
1632	Michael Harper	Michael	Harper	male	\N	graduate	University of Iowa	judge	Academy of American Poets	Lenore Marshall Poetry Prize	1981	poetry	book	25000	The Collected Poems Of Sterling A. Brown	f	\N	4334	\N
1753	Oscar Cargill	Oscar	Cargill	male	\N	\N	\N	judge	National Book Foundation	National Book Award	1955	poetry	book	10000	The Collected Poems Of Wallace Stevens	f	\N	4340	\N
1350	Laura Furman	Laura	Furman	female	\N	\N	\N	judge	PEN America	Faulkner Award for Fiction	2011	prose	book	15000	The Collected Stories Of Deborah Eisenberg	f	\N	4350	\N
654	Elder Olson	Elder	Olson	male	University of Chicago	graduate	\N	judge	National Book Foundation	National Book Award	1966	prose	book	10000	The Collected Stories Of Katherine Anne Porter	f	\N	4356	\N
1604	Maxwell Geismar	Maxwell	Geismar	male	Columbia University	graduate	\N	judge	National Book Foundation	National Book Award	1951	prose	book	10000	The Collected Stories Of William Faulkner	f	\N	4360	\N
2373	William Meredith	William	Meredith	male	Princeton University	\N	\N	judge	National Book Foundation	National Book Award	1970	poetry	book	10000	The Complete Poems	f	\N	4374	\N
1081	Joan Didion	Joan	Didion	female	\N	\N	\N	judge	National Book Foundation	National Book Award	1972	prose	book	10000	The Complete Stories	f	\N	4378	\N
1604	Maxwell Geismar	Maxwell	Geismar	male	Columbia University	graduate	\N	judge	Columbia University	Pulitzer Prize	1968	prose	book	15000	The Confessions Of Nat Turner	f	\N	4390	\N
133	Angela Davis Gardner	Angela Davis	Gardner	female	\N	graduate	University of North Carolina	judge	National Book Foundation	National Book Award	2001	prose	book	10000	The Corrections	f	\N	4396	\N
1812	Percival Everett	Percival	Everett	male	Brown University	graduate	Brown University	judge	PEN America	Hemingway Award for Debut Novel	2003	prose	book	10000	The Curious Case Of Benjamin Button Apt. 3W	f	\N	4406	\N
208	B. H. Fairchild	B. H.	Fairchild	male	\N	graduate	\N	judge	Claremont Graduate University	Kingsley Tufts Poetry Award	2001	poetry	book	100000	The Dead Alive And Busy	f	\N	4412	\N
505	David Bromwich	David	Bromwich	male	Yale University	graduate	\N	judge	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	1999	prose	book	15000	The Death Of Adam: Essays on Modern Thought	f	\N	4422	\N
1980	Robert Penn Warren	Robert Penn	Warren	male	\N	graduate	\N	judge	University of Pittsburg Press	Drue Heinz Literature Prize	1981	prose	book	15000	The Death Of Descartes	f	\N	4428	\N
1437	Louise Gluck	Louise	Gluck	female	\N	\N	\N	judge	Academy of American Poets	Lenore Marshall Poetry Prize	2005	poetry	book	25000	The Displaced Of Capital	f	\N	4430	\N
322	Caroline Fraser	Caroline	Fraser	female	Harvard University	graduate	\N	judge	PEN America	Robert W. Bingham Prize for Debut Short Story Collection	2015	prose	book	25000	The Dog	f	\N	4436	\N
1463	Lynne Sharon Schwartz	Lynne Sharon	Schwartz	female	\N	graduate	University of Iowa	judge	University of Pittsburg Press	Drue Heinz Literature Prize	2018	prose	book	15000	The Dogs Of Detroit	f	\N	4444	\N
751	Frank Bidart	Frank	Bidart	male	Harvard University	graduate	\N	judge	Columbia University	Pulitzer Prize	1996	poetry	book	15000	The Dream of the Unified Field	f	\N	4450	\N
2344	Wilbur L. Cross	Wilbur L.	Cross	male	Yale University	graduate	\N	judge	Columbia University	Pulitzer Prize	1942	poetry	book	15000	The Dust Which Is God	f	\N	4456	\N
2007	Ron Carlson	Ron	Carlson	male	\N	graduate	\N	judge	PEN America	Faulkner Award for Fiction	2004	prose	book	15000	The Early Stories 1953-1975	f	\N	4462	\N
1188	Jonathan Lethem	Jonathan	Lethem	male	\N	\N	\N	judge	National Book Foundation	National Book Award	2006	prose	book	10000	The Echo Maker	f	\N	4468	\N
1222	Josephine Herbst	Josephine	Herbst	female	\N	\N	\N	judge	National Book Foundation	National Book Award	1968	prose	book	10000	The Eighth Day	f	\N	4482	\N
117	Anatole Broyard	Anatole	Broyard	male	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1980	prose	book	15000	The Executioners Song	f	\N	4488	\N
905	Howard Moss	Howard	Moss	male	\N	\N	\N	judge	National Book Foundation	National Book Award	1965	poetry	book	10000	The Far Field	f	\N	4494	\N
1385	Leslie Fiedler	Leslie	Fiedler	male	\N	graduate	\N	judge	National Book Foundation	National Book Award	1957	prose	book	10000	The Field Of Vision	f	\N	4500	\N
1526	Mark Doty	Mark	Doty	male	\N	graduate	Goddard College	judge	Academy of American Poets	Lenore Marshall Poetry Prize	1997	poetry	book	25000	The Figured Wheel: New And Collected Poems 1966-1996	f	\N	4502	\N
2344	Wilbur L. Cross	Wilbur L.	Cross	male	Yale University	graduate	\N	judge	Columbia University	Pulitzer Prize	1932	poetry	book	15000	The Flowering Stone	f	\N	4514	\N
2371	William Matthews	William	Matthews	male	Yale University	graduate	\N	judge	Columbia University	Pulitzer Prize	1986	poetry	book	15000	The Flying Change: Poems	f	\N	4520	\N
869	Hayden Carruth	Hayden	Carruth	male	University of Chicago	graduate	\N	judge	Academy of American Poets	Lenore Marshall Poetry Prize	1976	poetry	book	25000	The Freeing Of The Dust	f	\N	4526	\N
379	Chris Bachelder	Chris	Bachelder	male	\N	graduate	University of Florida	judge	National Book Foundation	National Book Award	2018	prose	book	10000	The Friend	f	\N	4528	\N
724	Eula Biss	Eula	Biss	female	\N	graduate	University of Iowa	judge	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	2017	prose	book	15000	The Girls In My Town: Essays	f	\N	4538	\N
2008	Ron Charles	Ron	Charles	male	\N	graduate	\N	judge	Columbia University	Pulitzer Prize	2014	prose	book	15000	The Goldfinch	f	\N	4544	\N
1037	Jefferson Fletcher	Jefferson	Fletcher	male	Harvard University	graduate	\N	judge	Columbia University	Pulitzer Prize	1932	prose	book	15000	The Good Earth	f	\N	4550	\N
344	Charles Baxter	Charles	Baxter	male	\N	graduate	\N	judge	National Book Foundation	National Book Award	2013	prose	book	10000	The Good Lord Bird	f	\N	4556	\N
211	Barbara Ascher	Barbara	Ascher	female	\N	\N	\N	judge	Center for Fiction	First Novel Prize	2008	prose	book	15000	The Good Thief	f	\N	4568	\N
501	David Barber	David	Barber	male	Stanford University	graduate	\N	judge	Claremont Graduate University	Kingsley Tufts Poetry Award	2014	poetry	book	100000	The Government Of Nature	f	\N	4578	\N
1037	Jefferson Fletcher	Jefferson	Fletcher	male	Harvard University	graduate	\N	judge	Columbia University	Pulitzer Prize	1940	prose	book	15000	The Grapes Of Wrath	f	\N	4588	\N
1895	Richard Bausch	Richard	Bausch	male	\N	graduate	University of Iowa	judge	PEN America	Faulkner Award for Fiction	2008	prose	book	15000	The Great Man	f	\N	4603	\N
611	Douglas Crase	Douglas	Crase	male	Princeton University	\N	\N	judge	Academy of American Poets	Lenore Marshall Poetry Prize	1987	poetry	book	25000	The Happy Man	f	\N	4609	\N
1429	Louis Simpson	Louis	Simpson	male	Columbia University	graduate	\N	judge	Columbia University	Pulitzer Prize	1968	poetry	book	15000	The Hard Hours	f	\N	4615	\N
438	Cristina GarcÃ­a	Cristina	GarcÃ­a	female	Barnard College	graduate	\N	judge	PEN America	Faulkner Award for Fiction	2001	prose	book	15000	The Human Stain	f	\N	4632	\N
1423	Louis Begley	Louis	Begley	male	Harvard University	graduate	\N	judge	American Academy of Arts and Letters	Rosenthal Family Foundation Award	2014	prose	book	10000	The Isle Of Youth	f	\N	4640	\N
1390	Lewis Gannett	Lewis	Gannett	male	Harvard University	\N	\N	judge	Columbia University	Pulitzer Prize	1965	prose	book	15000	The Keepers Of The House	f	\N	4654	\N
314	Carlos Baker	Carlos	Baker	male	Dartmouth College Harvard University Princeton University	graduate	\N	judge	Columbia University	Pulitzer Prize	1975	prose	book	15000	The Killer Angels	f	\N	4658	\N
1900	Richard Eder	Richard	Eder	male	Harvard University	\N	\N	judge	Columbia University	Pulitzer Prize	2004	prose	book	15000	The Known World	f	\N	4664	\N
1037	Jefferson Fletcher	Jefferson	Fletcher	male	Harvard University	graduate	\N	judge	Columbia University	Pulitzer Prize	1938	prose	book	15000	The Late George Apley	f	\N	4672	\N
1337	Laila Lalami	Laila	Lalami	female	\N	graduate	\N	judge	PEN America	Bellwether Prize for Socially Engaged Fiction	2016	prose	book	25000	The Leavers	f	\N	4678	\N
591	Donald Hall	Donald	Hall	male	Harvard University Stanford University	graduate	\N	judge	National Book Foundation	National Book Award	1968	poetry	book	10000	The Light Around The Body	f	\N	4684	\N
1233	Joyce Carol Oates	Joyce Carol	Oates	female	\N	graduate	\N	judge	University of Pittsburg Press	Drue Heinz Literature Prize	1984	prose	book	15000	The Luckiest Man In The World	f	\N	4696	\N
91	Allegra Goodman	Allegra	Goodman	female	Harvard University Stanford University	graduate	\N	judge	PEN America	Hemingway Award for Debut Novel	2011	prose	book	10000	The Madonnas Of Echo Park	f	\N	4698	\N
1152	John Mackenzie Cory	John Mackenzie	Cory	male	University of Chicago	graduate	\N	judge	National Book Foundation	National Book Award	1959	prose	book	10000	The Magic Barrel	f	\N	4704	\N
1961	Robert Grant	Robert	Grant	male	Harvard University	graduate	\N	judge	Columbia University	Pulitzer Prize	1919	prose	book	15000	The Magnificent Ambersons	f	\N	4714	\N
1097	Joel Conarroe	Joel	Conarroe	male	\N	graduate	\N	judge	Columbia University	Pulitzer Prize	1990	prose	book	15000	The Mambo Kings Play Songs Of Love	f	\N	4720	\N
2344	Wilbur L. Cross	Wilbur L.	Cross	male	Yale University	graduate	\N	judge	Columbia University	Pulitzer Prize	1925	poetry	book	15000	The Man Who Died Twice	f	\N	4726	\N
1598	Max Apple	Max	Apple	male	\N	graduate	\N	judge	University of Pittsburg Press	Drue Heinz Literature Prize	1985	prose	book	15000	The Man Who Loved Levittown	f	\N	4732	\N
319	Carol Muske-Dukes	Carol	Muske-Dukes	female	\N	graduate	\N	judge	Academy of American Poets	Lenore Marshall Poetry Prize	1993	poetry	book	25000	The Man With Night Sweats	f	\N	4734	\N
1557	Mary Colum	Mary	Colum	female	\N	\N	\N	judge	National Book Foundation	National Book Award	1950	prose	book	10000	The Man With The Golden Arm	f	\N	4741	\N
803	George Garrett	George	Garrett	male	Princeton University	graduate	\N	judge	PEN America	Faulkner Award for Fiction	2006	prose	book	15000	The March	f	\N	4751	\N
470	Daniel Halpern	Daniel	Halpern	male	Columbia University	\N	\N	judge	Claremont Graduate University	Kate Tufts Discovery Award 	1995	poetry	book	10000	The Moon Reflected Fire	f	\N	4757	\N
1103	John Ashbery	John	Ashbery	male	Harvard University Columbia University	graduate	\N	judge	Columbia University	Pulitzer Prize	1981	poetry	book	15000	The Morning Of The Poem	f	\N	4767	\N
1390	Lewis Gannett	Lewis	Gannett	male	Harvard University	\N	\N	judge	National Book Foundation	National Book Award	1962	prose	book	10000	The Moviegoer	f	\N	4773	\N
328	Carolyn Kizer	Carolyn	Kizer	female	Columbia University	graduate	\N	judge	Academy of American Poets	Lenore Marshall Poetry Prize	1977	poetry	book	25000	The Names Of The Lost	f	\N	4781	\N
75	Alice Mattison	Alice	Mattison	female	Harvard University	graduate	\N	judge	University of Pittsburg Press	Drue Heinz Literature Prize	2011	prose	book	15000	The Necessity Of Certain Behaviors	f	\N	4787	\N
2281	Turner Cassity	Turner	Cassity	male	Stanford University Columbia University	graduate	\N	judge	National Book Foundation	National Book Award	1981	poetry	book	10000	The Need To Hold Still: Poems	f	\N	4789	\N
106	Amy Gerstler	Amy	Gerstler	female	\N	graduate	Bennington College	judge	Academy of American Poets	Lenore Marshall Poetry Prize	2016	poetry	book	25000	The Nerve Of It: Poems New And Selected	f	\N	4803	\N
125	Andrew Bacevich	Andrew	Bacevich	male	Princeton University	graduate	\N	winner	Lannan Foundation	Lannan Award	2005	no genre	career	150000	The New American Militarism: How Americans Are Seduced By War	f	\N	4809	\N
1403	Linda Hogan	Linda	Hogan	female	\N	graduate	\N	judge	National Book Foundation	National Book Award	2004	prose	book	10000	The News From Paraguay	f	\N	4811	\N
1506	Marie Arana	Marie	Arana	female	\N	graduate	\N	judge	Columbia University	Pulitzer Prize	2020	prose	book	15000	The Nickel Boys	f	\N	4822	\N
72	Alice Adams	Alice	Adams	female	Radcliffe College	\N	\N	judge	PEN America	Faulkner Award for Fiction	1986	prose	book	15000	The Old Forest And Other Stories	f	\N	4836	\N
2023	Roy Couden	Roy	Couden	male	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1953	prose	book	15000	The Old Man And The Sea	f	\N	4848	\N
107	Amy Hempel	Amy	Hempel	female	\N	\N	\N	judge	University of Pittsburg Press	Drue Heinz Literature Prize	2013	prose	book	15000	The Old Priest	f	\N	4852	\N
841	Guy Davenport	Guy	Davenport	male	Harvard University	graduate	\N	judge	Columbia University	Pulitzer Prize	1973	prose	book	15000	The Optimists Daughter	f	\N	4854	\N
1506	Marie Arana	Marie	Arana	female	\N	graduate	\N	judge	Columbia University	Pulitzer Prize	2013	prose	book	15000	The Orphan Masters Son	f	\N	4860	\N
1362	Lawrence Buell	Lawrence	Buell	male	Princeton University Cornell University	graduate	\N	judge	Columbia University	Pulitzer Prize	2019	prose	book	15000	The Overstory	f	\N	4866	\N
1523	Mark Bibbins	Mark	Bibbins	male	\N	graduate	New School for Social Research	judge	National Book Foundation	National Book Award	2016	poetry	book	10000	The Performance Of Becoming Human	f	\N	4877	\N
1889	Renata Adler	Renata	Adler	female	Harvard University	graduate	\N	judge	University of Pittsburg Press	Drue Heinz Literature Prize	2010	prose	book	15000	The Physics Of Imaginary Objects	f	\N	4887	\N
444	Cynthia Macdonald	Cynthia	Macdonald	female	\N	graduate	\N	judge	Academy of American Poets	Lenore Marshall Poetry Prize	1980	poetry	book	25000	The Poems Of Stanley Kunitz 1928-1978	f	\N	4889	\N
61	Alexander Chee	Alexander	Chee	male	\N	graduate	University of Iowa	judge	University of Pittsburg Press	Drue Heinz Literature Prize	2020	prose	book	15000	The Prince Of Mournful Thoughts And Other Stories	f	\N	4895	\N
314	Carlos Baker	Carlos	Baker	male	Dartmouth College Harvard University Princeton University	graduate	\N	judge	Columbia University	Pulitzer Prize	1955	prose	book	15000	The Reivers	f	\N	4897	\N
2115	Sonali Deraniyagala	Sonali	Deraniyagala	female	\N	graduate	\N	judge	PEN America	Jean Stein Book Award	2017	no genre	book	75000	The Return: Fathers Sons And The Land In Between	f	\N	4903	\N
777	Gail Caldwell	Gail	Caldwell	female	\N	graduate	University of Texas Austin	judge	Columbia University	Pulitzer Prize	2007	prose	book	15000	The Road	f	\N	4913	\N
2121	Stacey DErasmo	Stacey	DErasmo	female	Barnard College Stanford University	graduate	\N	judge	National Book Foundation	National Book Award	2012	prose	book	10000	The Round House	f	\N	4921	\N
309	Carl Dennis	Carl	Dennis	male	\N	graduate	\N	judge	Columbia University	Pulitzer Prize	2009	poetry	book	15000	The Shadow Of Sirius	f	\N	4929	\N
417	Cleanth Brooks	Cleanth	Brooks	male	\N	graduate	\N	judge	National Book Foundation	National Book Award	1956	poetry	book	10000	The Shield Of Achilles	f	\N	4935	\N
2187	Sven Birkerts	Sven	Birkerts	male	\N	\N	\N	judge	National Book Foundation	National Book Award	1993	prose	book	10000	The Shipping News	f	\N	4943	\N
212	Barbara Bannon	Barbara	Bannon	female	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1979	prose	book	15000	The Stories Of John Cheever	f	\N	4951	\N
1437	Louise Gluck	Louise	Gluck	female	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1995	poetry	book	15000	The Simple Truth	f	\N	4962	\N
500	David Baker	David	Baker	male	\N	graduate	\N	judge	National Book Foundation	National Book Award	2003	poetry	book	10000	The Singing	f	\N	4968	\N
1981	Robert Phillips	Robert	Phillips	male	Yale University	graduate	\N	judge	Academy of American Poets	Lenore Marshall Poetry Prize	1988	poetry	book	25000	The Sisters: New & Selected Poems	f	\N	4979	\N
2187	Sven Birkerts	Sven	Birkerts	male	\N	\N	\N	judge	University of Pittsburg Press	Drue Heinz Literature Prize	2012	prose	book	15000	The Source Of Life And Other Stories	f	\N	4985	\N
717	Erskine Caldwell	Erskine	Caldwell	male	\N	\N	\N	judge	National Book Foundation	National Book Award	1977	prose	book	10000	The Spectator Bird	f	\N	4987	\N
515	David Guterson	David	Guterson	male	\N	graduate	University of Washington	judge	University of Pittsburg Press	Drue Heinz Literature Prize	2014	prose	book	15000	The Spirit Bird	f	\N	4995	\N
405	Claire Messud	Claire	Messud	female	Yale University	graduate	Syracuse University	judge	Kirkus Review	Kirkus Prize	2016	prose	book	50000	The Sport Of Kings	f	\N	4997	\N
1097	Joel Conarroe	Joel	Conarroe	male	\N	graduate	\N	judge	Columbia University	Pulitzer Prize	1995	prose	book	15000	The Stone Diaries	f	\N	5003	\N
1037	Jefferson Fletcher	Jefferson	Fletcher	male	Harvard University	graduate	\N	judge	Columbia University	Pulitzer Prize	1933	prose	book	15000	The Store	f	\N	5009	\N
319	Carol Muske-Dukes	Carol	Muske-Dukes	female	\N	graduate	\N	judge	Claremont Graduate University	Kingsley Tufts Poetry Award	2002	poetry	book	100000	The Tether	f	\N	5033	\N
499	David Appel	David	Appel	male	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1951	prose	book	15000	The Town	f	\N	5043	\N
1510	Marilyn Chin	Marilyn	Chin	female	Stanford University	graduate	University of Iowa	judge	Columbia University	Pulitzer Prize	2020	poetry	book	15000	The Tradition	f	\N	5047	\N
314	Carlos Baker	Carlos	Baker	male	Dartmouth College Harvard University Princeton University	graduate	\N	judge	Columbia University	Pulitzer Prize	1959	prose	book	15000	The Travels Of Jaimie McPheeters	f	\N	5053	\N
1352	Laura Kasischke	Laura	Kasischke	female	\N	graduate	University of Michigan	judge	Academy of American Poets	Lenore Marshall Poetry Prize	2018	poetry	book	25000	The Trembling Answers	f	\N	5057	\N
501	David Barber	David	Barber	male	Stanford University	graduate	\N	judge	Claremont Graduate University	Kate Tufts Discovery Award 	2015	poetry	book	10000	The Tribute Horse	f	\N	5063	\N
354	Charles Johnson	Charles	Johnson	male	\N	graduate	\N	judge	University of Pittsburg Press	Drue Heinz Literature Prize	1999	prose	book	15000	The Truly Needy And Other Stories	f	\N	5073	\N
1131	John Guare	John	Guare	male	\N	graduate	Yale University	judge	American Academy of Arts and Letters	Rosenthal Family Foundation Award	2016	prose	book	10000	The Tsar Of Love And Techno	f	\N	5075	\N
700	Eric Banks	Eric	Banks	male	\N	\N	\N	judge	Columbia University	Pulitzer Prize	2017	prose	book	15000	The Underground Railroad	f	\N	5085	\N
861	Harris Fletcher	Harris	Fletcher	male	\N	graduate	\N	judge	Columbia University	Pulitzer Prize	1954	prose	book	15000	The Waking	f	\N	5101	\N
2295	Vanwyck Brooks	Vanwyck	Brooks	male	Harvard University	\N	\N	judge	National Book Foundation	National Book Award	1958	prose	book	10000	The Wapshot Chronicle	f	\N	5109	\N
209	B. J. Chute	B. J.	Chute	female	\N	\N	\N	judge	National Book Foundation	National Book Award	1961	prose	book	10000	The Waters Of Kronos	f	\N	5119	\N
499	David Appel	David	Appel	male	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1950	prose	book	15000	The Way West	f	\N	5125	\N
751	Frank Bidart	Frank	Bidart	male	Harvard University	graduate	\N	judge	Columbia University	Pulitzer Prize	1993	poetry	book	15000	The Wild Iris	f	\N	5131	\N
615	Dudley Fitts	Dudley	Fitts	male	Harvard University	\N	\N	judge	National Book Foundation	National Book Award	1961	poetry	book	10000	The Woman At The Washington Zoo: Poems And Translations	f	\N	5137	\N
262	Bonnie Costello	Bonnie	Costello	female	Cornell University	graduate	\N	judge	Columbia University	Pulitzer Prize	2000	poetry	book	15000	The World 	f	\N	5143	\N
783	Garrett Hongo	Garrett	Hongo	male	\N	graduate	Univeristy of California Irvine	judge	Columbia University	Pulitzer Prize	1990	poetry	book	15000	The World Doesnt End	f	\N	5149	\N
460	Dana Gioia	Dana	Gioia	male	Stanford University Harvard University	graduate	\N	judge	National Book Foundation	National Book Award	1994	poetry	book	10000	The Worshipful Company Of Fletchers: Poems	f	\N	5155	\N
1037	Jefferson Fletcher	Jefferson	Fletcher	male	Harvard University	graduate	\N	judge	Columbia University	Pulitzer Prize	1939	prose	book	15000	The Yearling	f	\N	5165	\N
104	Amy Bloom	Amy	Bloom	female	\N	\N	\N	judge	PEN America	Hemingway Award for Debut Novel	2013	prose	book	10000	The Yellow Birds	f	\N	5171	\N
319	Carol Muske-Dukes	Carol	Muske-Dukes	female	\N	graduate	\N	judge	Claremont Graduate University	Kate Tufts Discovery Award 	2003	poetry	book	10000	The Zoo	f	\N	5177	\N
577	Diane Johnson	Diane	Johnson	female	\N	\N	\N	judge	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	2015	prose	book	15000	Theater Of Cruelty: Art Film And The Shadows Of War	f	\N	5187	\N
70	Alfred Kreynborg	Alfred	Kreynborg	male	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1957	poetry	book	15000	Things Of This World	f	\N	5192	\N
215	Barbara Epstein	Barbara	Epstein	female	Radcliffe College	\N	\N	judge	National Book Foundation	National Book Award	1970	prose	book	10000	Them	f	\N	5197	\N
115	Ana Castillo	Ana	Castillo	female	University of Chicago	graduate	\N	judge	PEN America	Hemingway Award for Debut Novel	2008	prose	book	10000	Then We Came To The End	f	\N	5205	\N
1041	Jeffrey Renard Allen	Jeffrey Renard	Allen	male	\N	graduate	University of Illinois	judge	Center for Fiction	First Novel Prize	2018	prose	book	15000	There There	f	\N	5211	\N
660	Elena Karina Byrne	Elena Karina	Byrne	female	\N	\N	\N	judge	Claremont Graduate University	Kate Tufts Discovery Award 	2017	poetry	book	10000	Thief In The Interior	f	\N	5237	\N
1071	Jill McCorkle	Jill	McCorkle	female	\N	graduate	\N	judge	University of Pittsburg Press	Drue Heinz Literature Prize	2015	prose	book	15000	This Angel On My Chest	f	\N	5278	\N
1627	Michael Collier	Michael	Collier	male	\N	graduate	University of Arizona	judge	National Book Foundation	National Book Award	1998	poetry	book	10000	This Time: New And Selected Poems	f	\N	5280	\N
328	Carolyn Kizer	Carolyn	Kizer	female	Columbia University	graduate	\N	judge	Columbia University	Pulitzer Prize	1987	poetry	book	15000	Thomas And Beula	f	\N	5291	\N
23	Adrienne Brodeur	Adrienne	Brodeur	female	Columbia University University of Pennsylvania	graduate	\N	judge	National Book Foundation	National Book Award	2002	prose	book	10000	Three Junes	f	\N	5298	\N
1399	Linda Bierds	Linda	Bierds	female	\N	graduate	\N	judge	National Book Foundation	National Book Award	2007	poetry	book	10000	Time And Materials: Poems 1997-2005	f	\N	5308	\N
70	Alfred Kreynborg	Alfred	Kreynborg	male	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1961	poetry	book	15000	Times Three: Selected Verse From Three Decades	f	\N	5318	\N
354	Charles Johnson	Charles	Johnson	male	\N	graduate	\N	judge	Columbia University	Pulitzer Prize	2010	prose	book	15000	Tinkers	f	\N	5322	\N
1105	John Barkham	John	Barkham	male	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1961	prose	book	15000	To Kill A Mockingbird	f	\N	5330	\N
93	Allen Ginsberg	Allen	Ginsberg	male	Columbia University	\N	\N	judge	National Book Foundation	National Book Award	1971	poetry	book	10000	To See To Take: Poems	f	\N	5334	\N
1614	Mei-Mei Berssenbrugge	Mei-Mei	Berssenbrugge	female	Columbia University	graduate	Columbia University	judge	National Book Foundation	National Book Award	2009	poetry	book	10000	Transcendental Studies: A Trilogy	f	\N	5344	\N
966	James Dickey	James	Dickey	male	\N	\N	\N	judge	Columbia University	Pulitzer Prize	1970	poetry	book	15000	Untitled Subjects	f	\N	5348	\N
2005	Rolfe Humphries	Rolfe	Humphries	male	\N	\N	\N	judge	National Book Foundation	National Book Award	1963	poetry	book	10000	Traveling Through The Dark	f	\N	5353	\N
558	Deborah Digges	Deborah	Digges	female	\N	graduate	University of Iowa	judge	Academy of American Poets	Lenore Marshall Poetry Prize	1994	poetry	book	25000	Travels	f	\N	5359	\N
129	Andrew Sean Greer	Andrew Sean	Greer	male	Brown University	graduate	University of Montana	judge	National Book Foundation	National Book Award	2007	prose	book	10000	Tree Of Smoke	f	\N	5365	\N
149	Ann Patchett	Ann	Patchett	female	\N	graduate	University of Iowa	judge	University of Pittsburg Press	Drue Heinz Literature Prize	2009	prose	book	15000	Triple Time	f	\N	5375	\N
2344	Wilbur L. Cross	Wilbur L.	Cross	male	Yale University	graduate	\N	judge	Columbia University	Pulitzer Prize	1928	poetry	book	15000	Tristram	f	\N	5377	\N
605	Dorothy Allison	Dorothy	Allison	female	\N	graduate	\N	judge	National Book Foundation	National Book Award	2019	prose	book	10000	Trust Excercise	f	\N	5383	\N
1429	Louis Simpson	Louis	Simpson	male	Columbia University	graduate	\N	judge	Columbia University	Pulitzer Prize	1975	poetry	book	15000	Turtle Island	f	\N	5393	\N
85	Alison Lurie	Alison	Lurie	female	Radcliffe College	\N	\N	judge	University of Pittsburg Press	Drue Heinz Literature Prize	1986	prose	book	15000	Under The Wheat	f	\N	5399	\N
1331	Kwame Dawes	Kwame	Dawes	male	\N	graduate	\N	judge	Academy of American Poets	Lenore Marshall Poetry Prize	2014	poetry	book	25000	Unpeopled Eden	f	\N	5401	\N
2354	William Alfred	William	Alfred	male	Harvard University	graduate	\N	judge	Columbia University	Pulitzer Prize	1973	poetry	book	15000	Up Country	f	\N	5412	\N
883	Henry Seidel Canby	Henry Seidel	Canby	male	Yale University	graduate	\N	judge	Columbia University	Pulitzer Prize	1945	poetry	book	15000	V-Letter And Other Poems	f	\N	5418	\N
2016	Rosellen Brown	Rosellen	Brown	female	Barnard College	\N	\N	judge	University of Pittsburg Press	Drue Heinz Literature Prize	1996	prose	book	15000	Vaquita And Other Stories	f	\N	5424	\N
2133	Stephanie Burt	Stephanie	Burt	female	Harvard University Yale University	graduate	\N	judge	Columbia University	Pulitzer Prize	2010	poetry	book	15000	Versed	f	\N	5426	\N
1445	Lucille Clifton	Lucille	Clifton	female	\N	\N	\N	judge	National Book Foundation	National Book Award	1999	poetry	book	10000	Vice: New And Selected Poems	f	\N	5433	\N
1359	Laurie Colwin	Laurie	Colwin	female	\N	\N	\N	judge	National Book Foundation	National Book Award	1984	prose	book	10000	Victory Over Japan: A Book Of Stories[	f	\N	5442	\N
2100	Sherman Alexie	Sherman	Alexie	male	\N	\N	\N	judge	National Book Foundation	National Book Award	2015	poetry	book	10000	Voyage Of The Sable Venus	f	\N	5454	\N
605	Dorothy Allison	Dorothy	Allison	female	\N	graduate	\N	judge	National Book Foundation	National Book Award	1999	prose	book	10000	Waiting	f	\N	5464	\N
1401	Linda Gregerson	Linda	Gregerson	female	Stanford University	graduate	University of Iowa	judge	Columbia University	Pulitzer Prize	2004	poetry	book	15000	Walking To Marthas Vineyard	f	\N	5483	\N
1936	Rilla Askew	Rilla	Askew	female	\N	graduate	Brooklyn College	judge	PEN America	Faulkner Award for Fiction	2010	prose	book	15000	War Dances	f	\N	5495	\N
498	David Anthony Durham	David Anthony	Durham	male	\N	graduate	University of Maryland	judge	PEN America	Faulkner Award for Fiction	2005	prose	book	15000	War Trash	f	\N	5501	\N
223	Ben Fountain	Ben	Fountain	male	\N	graduate	\N	judge	Center for Fiction	First Novel Prize	2013	prose	book	15000	Wash	f	\N	5507	\N
319	Carol Muske-Dukes	Carol	Muske-Dukes	female	\N	graduate	\N	judge	Claremont Graduate University	Kingsley Tufts Poetry Award	2003	poetry	book	100000	Waterborne	f	\N	5513	\N
1471	Madison Smart Bell	Madison Smart	Bell	male	Princeton University	graduate	\N	judge	PEN America	Faulkner Award for Fiction	2014	prose	book	15000	We Are All Completely Beside Ourselves	f	\N	5523	\N
921	Indira Ganesan	Indira	Ganesan	female	\N	graduate	University of Iowa	judge	PEN America	Hemingway Award for Debut Novel	2014	prose	book	10000	We Need New Names	f	\N	5531	\N
883	Henry Seidel Canby	Henry Seidel	Canby	male	Yale University	graduate	\N	judge	Columbia University	Pulitzer Prize	1944	poetry	book	15000	Western Star	f	\N	5537	\N
1522	Mark Athitakis	Mark	Athitakis	male	\N	\N	\N	judge	Kirkus Review	Kirkus Prize	2017	prose	book	50000	What It Means When A Man Falls From The Sky	f	\N	5543	\N
2187	Sven Birkerts	Sven	Birkerts	male	\N	\N	\N	judge	PEN America	Diamonstein-Spielvogel Award for the Art of the Essay	2013	prose	book	15000	What Light Can Do: Essays on Art Imagination and the Natural World	f	\N	5549	\N
1632	Michael Harper	Michael	Harper	male	\N	graduate	University of Iowa	judge	National Book Foundation	National Book Award	1991	poetry	book	10000	What Work Is	f	\N	5556	\N
2344	Wilbur L. Cross	Wilbur L.	Cross	male	Yale University	graduate	\N	judge	Columbia University	Pulitzer Prize	1926	poetry	book	15000	Whats OClock	f	\N	5564	\N
1510	Marilyn Chin	Marilyn	Chin	female	Stanford University	graduate	University of Iowa	judge	PEN America	Jean Stein Book Award	2020	no genre	book	75000	Where Reasons End 	f	\N	5570	\N
1477	Major Jackson	Major	Jackson	male	\N	graduate	University of Oregon	judge	PEN America	Jean Stein Book Award	2018	no genre	book	75000	Whereas	f	\N	5580	\N
431	Cornelius Eady	Cornelius	Eady	male	\N	graduate	Warren Wilson College	judge	Academy of American Poets	Lenore Marshall Poetry Prize	1995	poetry	book	25000	Winter Numbers	f	\N	5588	\N
2285	Ursula Hegi	Ursula	Hegi	female	\N	\N	\N	judge	PEN America	Faulkner Award for Fiction	1997	prose	book	15000	Women In Their Beds	f	\N	5594	\N
5	A. M. Homes	A. M.	Homes	female	\N	graduate	University of Iowa	judge	Center for Fiction	First Novel Prize	2009	prose	book	15000	Woodsburner	f	\N	5601	\N
210	Babette Deutsch	Babette	Deutsch	female	Barnard College	\N	\N	judge	National Book Foundation	National Book Award	1959	poetry	book	10000	Words For The Wind: Poems Of Theodore Roethke	f	\N	5611	\N
1401	Linda Gregerson	Linda	Gregerson	female	Stanford University	graduate	University of Iowa	judge	Academy of American Poets	Lenore Marshall Poetry Prize	2012	poetry	book	25000	World Tree	f	\N	5621	\N
2031	Russell Banks	Russell	Banks	male	\N	\N	\N	judge	PEN America	Faulkner Award for Fiction	1988	prose	book	15000	Worlds End	f	\N	5627	\N
778	Gail Godwin	Gail	Godwin	female	\N	graduate	\N	judge	National Book Foundation	National Book Award	1986	prose	book	10000	Worlds Fair	f	\N	5633	\N
319	Carol Muske-Dukes	Carol	Muske-Dukes	female	\N	graduate	\N	judge	Claremont Graduate University	Kate Tufts Discovery Award 	2002	poetry	book	10000	Worlds Tallest Disaster	f	\N	5637	\N
1037	Jefferson Fletcher	Jefferson	Fletcher	male	Harvard University	graduate	\N	judge	Columbia University	Pulitzer Prize	1931	prose	book	15000	Years Of Grace	f	\N	5647	\N
1098	Joel Connaroe	Joel	Connaroe	male	\N	graduate	\N	judge	Columbia University	Pulitzer Prize	1985	poetry	book	15000	Yin	f	\N	5653	\N
1357	Lauren Groff	Lauren	Groff	female	\N	graduate	University of Wisconsin	judge	PEN America	Robert W. Bingham Prize for Debut Short Story Collection	2012	prose	book	25000	Zazen	f	\N	5659	\N
\.


--
-- Data for Name: user_book_likes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_book_likes (like_id, user_id, book_id, likedon, liked) FROM stdin;
89	48	1400	2024-03-13	t
\.


--
-- Data for Name: user_preferred_books; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_preferred_books (id, user_id, book_id) FROM stdin;
1	47	510
3	47	375
4	48	359
5	47	569
6	47	235
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, hash, reading_preference, favorite_genre) FROM stdin;
47	bubba	bubba@gmail.com	$2b$10$2jgrhaR3.tpXnRVSZAYFMeM6m2/TRAKRdvl44LVNUzl5NAvmSPJYS	\N	\N
48	Da Momma	juliamskala@gmail.com	$2b$10$RD5WHwqcvtqsghbcBXGCFOResAySuhoyPlRt4rCYpDcs5GxJhZgmO		historical
\.


--
-- Name: admins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admins_id_seq', 4, true);


--
-- Name: tablename_book_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tablename_book_id_seq', 14266, true);


--
-- Name: user_book_likes_like_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_book_likes_like_id_seq', 89, true);


--
-- Name: user_preferred_books_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_preferred_books_id_seq', 6, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 48, true);


--
-- Name: admins admins_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_email_key UNIQUE (email);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: admins admins_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_username_key UNIQUE (username);


--
-- Name: tablename tablename_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tablename
    ADD CONSTRAINT tablename_pkey PRIMARY KEY (book_id);


--
-- Name: tablename unique_book_title_author; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tablename
    ADD CONSTRAINT unique_book_title_author UNIQUE (title_of_winning_book, author_id);


--
-- Name: user_book_likes user_book_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_book_likes
    ADD CONSTRAINT user_book_likes_pkey PRIMARY KEY (like_id);


--
-- Name: user_book_likes user_book_likes_unique_user_book; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_book_likes
    ADD CONSTRAINT user_book_likes_unique_user_book UNIQUE (user_id, book_id);


--
-- Name: user_preferred_books user_preferred_books_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_preferred_books
    ADD CONSTRAINT user_preferred_books_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: user_book_likes fk_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_book_likes
    ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_preferred_books user_preferred_books_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_preferred_books
    ADD CONSTRAINT user_preferred_books_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.tablename(book_id);


--
-- Name: user_preferred_books user_preferred_books_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_preferred_books
    ADD CONSTRAINT user_preferred_books_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

